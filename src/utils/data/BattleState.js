import { EventType } from '@data/BattleMessages.js';

export class BattleInstancePokemon {
	constructor(pokemon, index) {
		this.id = pokemon.id;
		this.name = pokemon.name;
		this.level = pokemon.level || 100;
		this.index = index;
		this.types = pokemon.types || [];
		this.currentHp = pokemon.getStat('hp');
		this.maxHp = pokemon.getStat('hp');
		this.status = null; // 'burn', 'poison', 'paralysis', 'sleep', 'freeze', 'confusion'
		this.isFainted = false;

		this.baseStats = {
			hp: pokemon.getStat('hp'),
			attack: pokemon.getStat('attack'),
			defense: pokemon.getStat('defense'),
			spAtk: pokemon.getStat('sp-atk'),
			spDef: pokemon.getStat('sp-def'),
			speed: pokemon.getStat('speed')
		};
		this.statStages = {
			attack: 0,
			defense: 0,
			spAtk: 0,
			spDef: 0,
			speed: 0,
			accuracy: 0,
			evasion: 0
		};
		
		this.movePool = pokemon.movePool || [];
	}

	clone() {
		const cloned = new BattleInstancePokemon(
			{
				id: this.id,
				name: this.name,
				level: this.level,
				types: [...this.types],
				getStat: (stat) => this.baseStats[stat] || 0
			},
			this.index
		);
		cloned.currentHp = this.currentHp;
		cloned.status = this.status;
		cloned.isFainted = this.isFainted;
		cloned.statStages = { ...this.statStages };
		cloned.movePool = [...this.movePool];
		return cloned;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			index: this.index,
			currentHp: this.currentHp,
			maxHp: this.maxHp,
			status: this.status,
			isFainted: this.isFainted,
			statStages: { ...this.statStages }
		};
	}
}

export class BattlePlayer {
	constructor(accountId, team, playerIndex) {
		this.accountId = accountId;
		this.playerIndex = playerIndex; // 0 or 1
		this.team = team.map((pokemon, idx) => new BattleInstancePokemon(pokemon, idx));
		this.activePokemonIndex = 0;
		this.selectedMove = null; // { moveId, targetIndex } or null
		this.selectedSwitch = null; // index or null
		this.hasActed = false; // Did this player make a choice this turn?
	}

	getActivePokemon() {
		return this.team[this.activePokemonIndex];
	}

	clone() {
		const cloned = new BattlePlayer(this.accountId, [], this.playerIndex);
		cloned.team = this.team.map(p => p.clone());
		cloned.activePokemonIndex = this.activePokemonIndex;
		cloned.selectedMove = this.selectedMove ? { ...this.selectedMove } : null;
		cloned.selectedSwitch = this.selectedSwitch;
		cloned.hasActed = this.hasActed;
		return cloned;
	}

	toJSON() {
		return {
			accountId: this.accountId,
			playerIndex: this.playerIndex,
			team: this.team.map(p => p.toJSON()),
			activePokemonIndex: this.activePokemonIndex,
			selectedMove: this.selectedMove ? { ...this.selectedMove } : null,
			selectedSwitch: this.selectedSwitch,
			hasActed: this.hasActed
		};
	}
}

export class BattleState {
	constructor(player1Id, player2Id, team1, team2) {
		this.battleId = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
		this.player1 = new BattlePlayer(player1Id, team1, 0);
		this.player2 = new BattlePlayer(player2Id, team2, 1);
		
		this.turnNumber = 0;
		this.sequenceNumber = 0;
		this.phase = 'selection'; // 'selection' | 'resolution' | 'ended'
		this.weather = null; // { type, turnsRemaining }
		this.terrain = null; // { type, turnsRemaining }
		this.eventLog = [];
	}

	applyEvent(event) {
		const newState = this.clone();

		switch (event.type) {
			case EventType.DAMAGE:
				return this.#applyDamage(newState, event);
			case EventType.STATUS_APPLY:
				return this.#applyStatus(newState, event);
			case EventType.STATUS_REMOVE:
				return this.#removeStatus(newState, event);
			case EventType.POKEMON_FAINTED:
				return this.#fainthPokemon(newState, event);
			case EventType.POKEMON_SWITCH:
				return this.#switchPokemon(newState, event);
			case EventType.STAT_CHANGE:
				return this.#changeStats(newState, event);
			case EventType.WEATHER_CHANGE:
				return this.#changeWeather(newState, event);
			case EventType.MOVE_USED:
			case EventType.MOVE_MISSED:
			case EventType.MOVE_FAILED:
			case EventType.STATUS_DAMAGE:
			case EventType.TURN_START_EVENT:
			case EventType.TURN_END_EVENT:
				newState.eventLog.push(event);
				return newState;
			default:
				console.warn(`Unknown event type: ${event.type}`);
				return newState;
		}
	}

	applyEvents(events) {
		return events.reduce((state, event) => state.applyEvent(event), this);
	}

	resolveTurn() {
		const newState = this.clone();
		newState.sequenceNumber++;
		newState.phase = 'resolution';
		return newState;
	}

	beginTurn() {
		const newState = this.clone();
		newState.turnNumber++;
		newState.phase = 'selection';
		newState.player1.selectedMove = null;
		newState.player1.selectedSwitch = null;
		newState.player1.hasActed = false;
		newState.player2.selectedMove = null;
		newState.player2.selectedSwitch = null;
		newState.player2.hasActed = false;
		return newState;
	}

	isOver() {
		return this.phase === 'ended';
	}

	getWinner() {
		const p1Lost = this.player1.team.every(p => p.isFainted);
		const p2Lost = this.player2.team.every(p => p.isFainted);

		if (p1Lost && !p2Lost) return 1; // Player 2 wins
		if (p2Lost && !p1Lost) return 0; // Player 1 wins
		if (p1Lost && p2Lost) return -1; // Draw (shouldn't happen)
		return null; // No winner yet
	}

	endBattle() {
		const newState = this.clone();
		newState.phase = 'ended';
		return newState;
	}

	clone() {
		const cloned = new BattleState(
			this.player1.accountId,
			this.player2.accountId,
			[],
			[]
		);
		cloned.battleId = this.battleId;
		cloned.player1 = this.player1.clone();
		cloned.player2 = this.player2.clone();
		cloned.turnNumber = this.turnNumber;
		cloned.sequenceNumber = this.sequenceNumber;
		cloned.phase = this.phase;
		cloned.weather = this.weather ? { ...this.weather } : null;
		cloned.terrain = this.terrain ? { ...this.terrain } : null;
		cloned.eventLog = [...this.eventLog];
		return cloned;
	}

	toJSON() {
		return {
			battleId: this.battleId,
			turnNumber: this.turnNumber,
			sequenceNumber: this.sequenceNumber,
			phase: this.phase,
			player1: this.player1.toJSON(),
			player2: this.player2.toJSON(),
			weather: this.weather,
			terrain: this.terrain,
			eventLog: this.eventLog
		};
	}

	static fromJSON(json) {
		const state = new BattleState(json.player1.accountId, json.player2.accountId, [], []);
		state.battleId = json.battleId;
		state.turnNumber = json.turnNumber;
		state.sequenceNumber = json.sequenceNumber;
		state.phase = json.phase;
		state.weather = json.weather;
		state.terrain = json.terrain;
		state.eventLog = json.eventLog;
		
		// Reconstruct players (temporary empty teams)
		state.player1 = new BattlePlayer('', [], 0);
		state.player2 = new BattlePlayer('', [], 1);
		
		return state;
	}

	#applyDamage(state, event) {
		const { target, pokemonIndex, newHp } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		const pokemon = player.team[pokemonIndex];
		
		if (pokemon) {
			pokemon.currentHp = newHp;
		}
		
		state.eventLog.push(event);
		return state;
	}

	#applyStatus(state, event) {
		const { target, pokemonIndex, status } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		const pokemon = player.team[pokemonIndex];
		
		if (pokemon) {
			pokemon.status = status;
		}
		
		state.eventLog.push(event);
		return state;
	}

	#removeStatus(state, event) {
		const { target, pokemonIndex } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		const pokemon = player.team[pokemonIndex];
		
		if (pokemon) {
			pokemon.status = null;
		}
		
		state.eventLog.push(event);
		return state;
	}

	#fainthPokemon(state, event) {
		const { target, pokemonIndex } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		const pokemon = player.team[pokemonIndex];
		
		if (pokemon) {
			pokemon.isFainted = true;
			pokemon.currentHp = 0;
		}
		
		state.eventLog.push(event);
		return state;
	}

	#switchPokemon(state, event) {
		const { target, toIndex } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		
		const newPokemon = player.team[toIndex];
		if (newPokemon && !newPokemon.isFainted) {
			player.activePokemonIndex = toIndex;
		}
		
		state.eventLog.push(event);
		return state;
	}

	#changeStats(state, event) {
		const { target, pokemonIndex, stat, stages } = event;
		const player = target === 'player1' ? state.player1 : state.player2;
		const pokemon = player.team[pokemonIndex];
		
		if (pokemon && pokemon.statStages.hasOwnProperty(stat)) {
			// Max/min at +6/-6
			pokemon.statStages[stat] = Math.max(-6, Math.min(6, pokemon.statStages[stat] + stages));
		}
		
		state.eventLog.push(event);
		return state;
	}

	#changeWeather(state, event) {
		const { weatherType, turnsRemaining } = event;
		state.weather = weatherType ? { type: weatherType, turnsRemaining } : null;
		state.eventLog.push(event);
		return state;
	}
}