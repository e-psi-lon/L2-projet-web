import { BattleState, BattleInstancePokemon } from '@data/BattleState.js';
import Pokemon from '@data/Pokemon.js';
import BaseView from '@ui/BaseView.js';
import {
	MessageType,
	EventType,
	createTurnStartMessage,
	createBattleEventMessage,
	createBattleEndMessage,
	createTurnEndMessage,
	createErrorMessage,
	createMoveUsedEvent,
	createMoveMissedEvent,
	createDamageEvent,
	createPokemonFaintedEvent,
	createPokemonSwitchEvent,
	createWeatherChangeEvent,
	createStatusApplyEvent,
	createStatChangeEvent,
	createXpGainMessage,
	createLevelUpEvent
} from '@data/BattleMessages.js';


export class BattleController {
	constructor(webrtc, isHost, initialState, api, inventoryManager = null) {
		this.webrtc = webrtc;
		this.isHost = isHost;
		this.state = initialState;
		this.api = api;
		this.inventoryManager = inventoryManager;

		this.playerIndex = isHost ? 0 : 1;
		this.opponentName = null;
		this.listeners = [];
		this.#setupWebRTCHandlers();
	}

	onStateChange(callback) {
		this.listeners.push({ type: 'stateChange', callback });
	}

	onResolveUsername(callback) {
		this.listeners.push({ type: 'usernameResolved', callback });
	}

	onBattleEvent(callback) {
		this.listeners.push({ type: 'battleEvent', callback });
	}

	#notifyListeners(type = 'stateChange') {
		if (type === 'stateChange')
			this.listeners.filter(l => l.type === 'stateChange').forEach(l => l.callback(this.state));
		else if (type === 'usernameResolved')
			this.listeners.filter(l => l.type === 'usernameResolved').forEach(l => l.callback(this.opponentName));
	}

	#notifyBattleEvent(eventInfo) {
		const battleEventListeners = this.listeners.filter(l => l.type === 'battleEvent');
		battleEventListeners.forEach(l => l.callback(eventInfo));
	}

	#setupWebRTCHandlers() {
		this.webrtc.onMessage(async (message) => {
			console.log('Received message:', message);
			await this.#handleMessage(message);
		});

		this.webrtc.onConnectionClose(() => {
			this.#handleDisconnect();
		});
	}

	selectMove(move, targetIndex) {
		const player = this.isHost ? this.state.player1 : this.state.player2;
		const activePokemon = player.getActivePokemon();
		move = move.move
		const moveName = move.name;
		if (!activePokemon.movePool.map(m => m.move.name).includes(moveName)) {
			console.error(`Invalid move: ${moveName}`, { available: activePokemon.movePool, selected: moveName });
			return;
		}
		player.selectedMove = {
			moveId: this.api.getMoveId(move),
			targetIndex
		};
		player.hasActed = true;

		if (!this.isHost) try {
			this.webrtc.send({
				type: MessageType.MOVE_SELECTED,
				moveId: this.api.getMoveId(move),
				targetIndex,
				timestamp: Date.now()
			});
		} catch (error) {
			console.warn('Failed to send move selection:', error);
		}

		this.#notifyListeners();

		if (this.state.player1.hasActed && this.state.player2.hasActed)
			this.startTurn().catch(err => console.error('Error starting turn:', err));
	}

	async startTurn() {
		if (!this.isHost) return;
		if (!this.state.player1.hasActed || !this.state.player2.hasActed) {
			console.warn('Cannot start turn - not all players have acted');
			return;
		}
		this.state = this.state.resolveTurn();
		this.#notifyListeners();
		this.webrtc.send(createTurnStartMessage(this.state.turnNumber, this.state.sequenceNumber));
		await this.#resolveActions();
	}

	async #resolveActions() {
		if (!this.isHost) return;
		const events = [];
		if (this.state.player1.selectedSwitch !== null) {
			const switchEvent = createPokemonSwitchEvent(
				'player1',
				this.state.player1.activePokemonIndex,
				this.state.player1.selectedSwitch
			);
			events.push(switchEvent);
			this.state = this.state.applyEvent(switchEvent);
		}

		if (this.state.player2.selectedSwitch !== null) {
			const switchEvent = createPokemonSwitchEvent(
				'player2',
				this.state.player2.activePokemonIndex,
				this.state.player2.selectedSwitch
			);
			events.push(switchEvent);
			this.state = this.state.applyEvent(switchEvent);
		}

		const moveActions = [];

		if (this.state.player1.selectedMove) {
			const move = await this.api.getMove(this.state.player1.selectedMove.moveId);
			moveActions.push({
				playerIndex: 0,
				moveId: this.state.player1.selectedMove.moveId,
				targetIndex: this.state.player1.selectedMove.targetIndex,
				speed: this.state.player1.getActivePokemon().baseStats.speed,
				priority: move.priority || 0
			});
		}

		if (this.state.player2.selectedMove) {
			const move = await this.api.getMove(this.state.player2.selectedMove.moveId);
			moveActions.push({
				playerIndex: 1,
				moveId: this.state.player2.selectedMove.moveId,
				targetIndex: this.state.player2.selectedMove.targetIndex,
				speed: this.state.player2.getActivePokemon().baseStats.speed,
				priority: move.priority || 0
			});
		}

		moveActions.sort((a, b) => {
			if (a.priority !== b.priority) return b.priority - a.priority;
			return b.speed - a.speed;
		});

		for (const action of moveActions) {
			const moveEvents = await this.#executeMove(
				action.playerIndex,
				action.moveId,
				action.targetIndex
			);
			events.push(...moveEvents);
			this.state = this.state.applyEvents(moveEvents);
		}

		const faintEvents = this.#checkForFaints();
		events.push(...faintEvents);
		this.state = this.state.applyEvents(faintEvents);

		const weatherEvents = this.#applyWeatherEffects();
		events.push(...weatherEvents);
		this.state = this.state.applyEvents(weatherEvents);

		const weatherDecrementEvent = this.#decrementWeather();
		if (weatherDecrementEvent) {
			events.push(weatherDecrementEvent);
			this.state = this.state.applyEvent(weatherDecrementEvent);
		}

		const winner = this.state.getWinner();
		if (winner !== null) {
			this.state = this.state.endBattle();
			events.push({ type: EventType.TURN_END_EVENT });
			this.#awardXpToWinner(winner);
		}

		this.webrtc.send(createBattleEventMessage(this.state.sequenceNumber, events));
		for (const event of events) this.#notifyBattleEvent(event);
		this.#notifyListeners();

		if (winner !== null) {
			const loser = winner === 0 ? 1 : 0;
			this.webrtc.send(createBattleEndMessage(winner, loser));
		} else {
			this.state = this.state.beginTurn();
			this.#notifyListeners();
			this.webrtc.send(createTurnEndMessage(this.state.turnNumber, this.state.sequenceNumber));
		}
	}

	async #executeMove(playerIndex, moveId, targetIndex) {
		const move = await this.api.getMove(moveId);
		const events = [];
		const attacker = playerIndex === 0 ? this.state.player1 : this.state.player2;
		const defender = playerIndex === 0 ? this.state.player2 : this.state.player1;

		const attackerPokemon = attacker.getActivePokemon();
		const targetPlayer = targetIndex === -1 ? attacker : defender;
		const targetPokemon = targetIndex === -1
			? attackerPokemon
			: targetPlayer.team[targetIndex];

		events.push(createMoveUsedEvent(
			playerIndex,
			attackerPokemon.index,
			moveId,
			targetIndex
		));

		const moveAccuracy = move.accuracy;
		if (moveAccuracy !== null) {
			const missChance = 1 - (moveAccuracy / 100);
			if (Math.random() < missChance) {
				events.push(createMoveMissedEvent(playerIndex, attackerPokemon.index, moveId));
				return events;
			}
		}

		if (move.power === null || move.power === 0) {
			const weatherEvent = await this.#detectWeatherChange(move);
			if (weatherEvent) events.push(weatherEvent);
			return events;
		}

		const damage = await this.#calculateDamage(attackerPokemon, targetPokemon, move);

		const newHp = Math.max(0, targetPokemon.currentHp - damage);
		const targetPlayerStr = targetIndex === -1
			? (playerIndex === 0 ? 'player1' : 'player2')
			: (playerIndex === 0 ? 'player2' : 'player1');

		events.push(createDamageEvent(targetPlayerStr, targetPokemon.index, damage, newHp));

		if (newHp === 0)
			events.push(createPokemonFaintedEvent(targetPlayerStr, targetPokemon.index));

		const secondaryEvents = await this.#detectSecondaryEffects(move, targetPokemon, playerIndex);
		events.push(...secondaryEvents);

		return events;
	}

	async #calculateDamage(attacker, defender, move) {
		const power = move.power || 50;
		const level = attacker.level;
		const attack = attacker.baseStats.attack;
		const defense = defender.baseStats.defense;
		const baseDamage = Math.floor((((2 * level / 5 + 2) * power * attack) / defense) / 50) + 2;

		let typeMultiplier = 1;
		if (attacker.types.length > 0)
			typeMultiplier = await this.#getTypeEffectiveness(attacker.types[0], defender.types);

		let weatherMultiplier = 1;
		if (this.state.weather) {
			const weatherType = this.state.weather.type;
			const moveType = move.type?.name || '';

			if (weatherType === 'sunny')
				if (moveType === 'fire') weatherMultiplier = 1.5;
				else if (moveType === 'water') weatherMultiplier = 0.5;
			else if (weatherType === 'rain')
				if (moveType === 'water') weatherMultiplier = 1.5;
				else if (moveType === 'fire') weatherMultiplier = 0.5;

			else if (weatherType === 'sandstorm')
				if (moveType === 'rock') weatherMultiplier = 1.5;
		}

		const variance = 0.85 + Math.random() * 0.15;
		const damage = Math.floor(baseDamage * typeMultiplier * weatherMultiplier * variance);

		return Math.max(1, damage);
	}

	async #getTypeEffectiveness(attackType, defenderTypes) {
		try {
			const typeData = await this.api.getType(attackType);
			let multiplier = 1;

			for (const defType of defenderTypes) {
				if (typeData.damage_relations.double_damage_to.some(t => t.name === defType))
					multiplier *= 2;
				if (typeData.damage_relations.half_damage_to.some(t => t.name === defType))
					multiplier *= 0.5;
				if (typeData.damage_relations.no_damage_to.some(t => t.name === defType)) {
					multiplier = 0;
					break;
				}
			}

			return multiplier;
		} catch (error) {
			console.warn(`Failed to get type data for ${attackType}:`, error);
			return 1;
		}
	}

	#checkForFaints() {
		const events = [];

		if (this.state.player1.getActivePokemon().isFainted) {
			const nextPokemon = this.state.player1.team.find(p => !p.isFainted);
			if (nextPokemon) {
				const switchEvent = createPokemonSwitchEvent(
					'player1',
					this.state.player1.activePokemonIndex,
					nextPokemon.index
				);
				events.push(switchEvent);
			}
		}

		if (this.state.player2.getActivePokemon().isFainted) {
			const nextPokemon = this.state.player2.team.find(p => !p.isFainted);
			if (nextPokemon) {
				const switchEvent = createPokemonSwitchEvent(
					'player2',
					this.state.player2.activePokemonIndex,
					nextPokemon.index
				);
				events.push(switchEvent);
			}
		}

		return events;
	}

	#applyWeatherEffects() {
		const events = [];
		if (!this.state.weather) return events;

		const { type: weatherType } = this.state.weather;

		if (weatherType === 'sandstorm') {
			const p1Active = this.state.player1.getActivePokemon();
			if (p1Active && !p1Active.types.includes('ground') && !p1Active.types.includes('rock') && !p1Active.types.includes('steel')) {
				const damage = Math.floor(p1Active.maxHp / 8);
				events.push(createDamageEvent('player1', p1Active.index, damage, Math.max(0, p1Active.currentHp - damage)));
			}

			const p2Active = this.state.player2.getActivePokemon();
			if (p2Active && !p2Active.types.includes('ground') && !p2Active.types.includes('rock') && !p2Active.types.includes('steel')) {
				const damage = Math.floor(p2Active.maxHp / 8);
				events.push(createDamageEvent('player2', p2Active.index, damage, Math.max(0, p2Active.currentHp - damage)));
			}
		}

		if (weatherType === 'hail') {
			const p1Active = this.state.player1.getActivePokemon();
			if (p1Active && !p1Active.types.includes('ice')) {
				const damage = Math.floor(p1Active.maxHp / 8);
				events.push(createDamageEvent('player1', p1Active.index, damage, Math.max(0, p1Active.currentHp - damage)));
			}

			const p2Active = this.state.player2.getActivePokemon();
			if (p2Active && !p2Active.types.includes('ice')) {
				const damage = Math.floor(p2Active.maxHp / 8);
				events.push(createDamageEvent('player2', p2Active.index, damage, Math.max(0, p2Active.currentHp - damage)));
			}
		}

		return events;
	}

	async #detectWeatherChange(move) {
		if (!move.name || !move.effect_entries) return null;

		const moveName = move.name.toLowerCase();
		const weatherMap = {
			'sunny-day': { type: 'sunny', turns: 5 },
			'rain-dance': { type: 'rain', turns: 5 },
			'sandstorm': { type: 'sandstorm', turns: 5 },
			'hail': { type: 'hail', turns: 5 },
			'snow': { type: 'hail', turns: 5 },
			'primordial-sea': { type: 'rain', turns: 8 },
			'desolate-land': { type: 'sunny', turns: 8 },
			'delta-stream': { type: 'strong-wind', turns: 8 }
		};

		if (weatherMap[moveName]) {
			const weather = weatherMap[moveName];
			return createWeatherChangeEvent(weather.type, weather.turns);
		}
		const effectText = (move.effect_entries[0]?.effect || '').toLowerCase();
		if (effectText.includes('sandstorm'))
			return createWeatherChangeEvent('sandstorm', 5);
		else if (effectText.includes('sunny') || effectText.includes('sunlight'))
			return createWeatherChangeEvent('sunny', 5);
		else if (effectText.includes('rain'))
			return createWeatherChangeEvent('rain', 5);
		else if (effectText.includes('hail') || effectText.includes('snow'))
			return createWeatherChangeEvent('hail', 5);

		return null;
	}

	#decrementWeather() {
		if (!this.state.weather) return null;

		const turnsRemaining = this.state.weather.turnsRemaining - 1;

		if (turnsRemaining <= 0)
			return createWeatherChangeEvent(null, 0);
		return createWeatherChangeEvent(this.state.weather.type, turnsRemaining);
	}

	#awardXpToWinner(winnerIndex) {
		const winner = winnerIndex === 0 ? this.state.player1 : this.state.player2;
		const loser = winnerIndex === 0 ? this.state.player2 : this.state.player1;
		let totalXpAwarded = 0;
		for (const loserPokemon of loser.team) {
			if (!loserPokemon.isFainted) {
				const xpGain = Math.ceil(loserPokemon.level * 10);
				totalXpAwarded += xpGain;
			}
		}
		const winnerIsHost = (winnerIndex === 0 && this.isHost) || (winnerIndex === 1 && !this.isHost);
		const activePokemonIndex = winner.activePokemonIndex;
		const winnerPlayerStr = winnerIndex === 0 ? 'player1' : 'player2';

		if (winnerIsHost && this.inventoryManager) {
			const selectedTeam = this.inventoryManager.getSelectedTeam();
			if (selectedTeam && selectedTeam.length > activePokemonIndex) {
				const pokemon = selectedTeam[activePokemonIndex];
				const newLevel = pokemon.gainXp(totalXpAwarded);
				this.inventoryManager.setSelectedTeam(selectedTeam);
				if (newLevel) {
					const levelUpEvent = createLevelUpEvent(winnerPlayerStr, activePokemonIndex, newLevel);
					this.#notifyBattleEvent(levelUpEvent);
				}
			}
		} else if (!winnerIsHost && this.isHost) this.webrtc.send(createXpGainMessage(totalXpAwarded, activePokemonIndex));
	}

	async #detectSecondaryEffects(move, targetPokemon, playerIndex) {
		const events = [];
		if (!move.effect_entries || move.effect_entries.length === 0) return events;

		const effectChance = move.effect_chance || 0;
		if (effectChance <= 0) return events;

		if (Math.random() * 100 > effectChance) return events;

		const effectText = (move.effect_entries[0]?.effect || '').toLowerCase();
		const targetPlayerStr = playerIndex === 0 ? 'player2' : 'player1';

		const statusMap = {
			'freeze': ['freeze', 'frozen'],
			'burn': ['burn', 'burned'],
			'poison': ['poison', 'poisoned'],
			'paralysis': ['paralyze', 'paralyzed', 'paralysis'],
			'sleep': ['sleep', 'asleep'],
			'confusion': ['confuse', 'confused', 'confusion']
		};

		for (const [status, keywords] of Object.entries(statusMap)) {
			if (keywords.some(kw => effectText.includes(kw))) {
				events.push(createStatusApplyEvent(targetPlayerStr, targetPokemon.index, status));
				break;
			}
		}

		if (effectText.includes('raises attack') || effectText.includes('increase attack'))
			events.push(createStatChangeEvent(targetPlayerStr, targetPokemon.index, 'attack', 1));
		else if (effectText.includes('lowers attack') || effectText.includes('decrease attack'))
			events.push(createStatChangeEvent(targetPlayerStr, targetPokemon.index, 'attack', -1));

		if (effectText.includes('raises defense') || effectText.includes('increase defense'))
			events.push(createStatChangeEvent(targetPlayerStr, targetPokemon.index, 'defense', 1));

		if (effectText.includes('raises speed') || effectText.includes('increase speed'))
			events.push(createStatChangeEvent(targetPlayerStr, targetPokemon.index, 'speed', 1));

		return events;
	}

	async #handleMessage(message) {
		try {
			switch (message.type) {
				case MessageType.ACCOUNT_NAME:
					this.#handleAccountName(message);
					break;
				case MessageType.TEAM_SELECTED:
					await this.#handleTeamSelected(message);
					break;
				case MessageType.TURN_START:
					this.#handleTurnStart(message);
					break;
				case MessageType.BATTLE_EVENT:
					this.#handleBattleEvents(message);
					break;
				case MessageType.TURN_END:
					this.#handleTurnEnd(message);
					break;
				case MessageType.BATTLE_END:
					this.#handleBattleEnd(message);
					break;
				case MessageType.FULL_SYNC:
					this.#handleFullSync(message);
					break;
				case MessageType.MOVE_SELECTED:
					if (this.isHost) this.#handleMoveSelected(message);
					break;
				case MessageType.SWITCH_SELECTED:
					if (this.isHost) this.#handleSwitchSelected(message);
					break;
				case MessageType.XP_GAIN:
					this.#handleXpGain(message);
					break;
				default:
					console.warn(`Unknown message type: ${message.type}`);
			}
		} catch (error) {
			console.error('Error handling message:', error);
			this.webrtc.send(createErrorMessage('MESSAGE_ERROR', error.message));
		}
	}

	#handleMoveSelected(message) {
		const { moveId, targetIndex } = message;
		this.state = this.state.clone({
			player2: {
				selectedMove: { moveId, targetIndex },
				hasActed: true
			}
		});
		this.#notifyListeners();

		if (this.state.player1.hasActed && this.state.player2.hasActed) {
			this.startTurn().catch(err => console.error('Error starting turn:', err));
		}
	}

	#handleSwitchSelected(message) {
		const { newPokemonIndex } = message;
		this.state = this.state.clone({
			player2: {
				selectedSwitch: newPokemonIndex,
				hasActed: true
			}
		});
		this.#notifyListeners();

		if (this.state.player1.hasActed && this.state.player2.hasActed) {
			this.startTurn().catch(err => console.error('Error starting turn:', err));
		}
	}

	#handleTurnStart(message) {
		this.state = this.state.clone({
			turnNumber: message.turnNumber,
			sequenceNumber: message.sequenceNumber,
			phase: 'resolution'
		});
		this.#notifyListeners();
	}

	#handleBattleEvents(message) {
		this.state = this.state.applyEvents(message.events);
		for (const event of message.events) this.#notifyBattleEvent(event);
		this.#notifyListeners();
	}

	#handleAccountName(message) {
		this.opponentName = message.accountName;
		this.#notifyListeners('usernameResolved');
	}

	#handleTeamSelected(message) {
		const { team } = message;
		try {
			const pokemonTeam = team.map(pokemonData => Pokemon.fromJSON(pokemonData));
			const battleInstanceTeam = pokemonTeam.map((p, idx) => new BattleInstancePokemon(p, idx));
			const playerOverride = { team: battleInstanceTeam };
			const overrides = this.isHost ? { player2: playerOverride } : { player1: playerOverride };
			this.state = this.state.clone(overrides);
			const currentView = BaseView.getCurrentView();
			if (currentView && typeof currentView.setOpponentTeam === 'function')
				currentView.setOpponentTeam(pokemonTeam);
		} catch (error) {
			console.error('Failed to load opponent team:', error);
		}
	}

	#handleTurnEnd() {
		this.state = this.state.beginTurn();
		this.#notifyListeners();
	}

	#handleBattleEnd() {
		this.state = this.state.endBattle();
		this.#notifyListeners();
	}

	#handleFullSync(message) {
		const { stateJson } = message;
		try {
			const syncState = JSON.parse(stateJson);
			this.state = BattleState.fromJSON(syncState);
			this.#notifyListeners();
		} catch (error) {
			console.error('Failed to parse full sync:', error);
			this.webrtc.send(createErrorMessage('SYNC_PARSE_ERROR', error.message));
		}
	}

	#handleXpGain(message) {
		const { xpAmount, pokemonIndex } = message;
		if (!this.inventoryManager) {
			console.warn('No inventory manager to apply XP gain');
			return;
		}

		const selectedTeam = this.inventoryManager.getSelectedTeam();
		if (selectedTeam && selectedTeam.length > pokemonIndex) {
			const pokemon = selectedTeam[pokemonIndex];
			const newLevel = pokemon.gainXp(xpAmount);
			this.inventoryManager.setSelectedTeam(selectedTeam);
			if (newLevel) {
				const levelUpEvent = createLevelUpEvent('player2', pokemonIndex, newLevel);
				this.#notifyBattleEvent(levelUpEvent);
			}
		}
	}

	#handleDisconnect() {
		console.warn('Battle connection lost');
		this.listeners.forEach(listener => listener(this.state));
	}

	close() {
		this.listeners = [];
	}
}

export default BattleController;

