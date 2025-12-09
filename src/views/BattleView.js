import Pokemon from "@data/Pokemon.js";
import BaseView from "@ui/BaseView.js";
import BattleController from "@utils/BattleController.js";
import { BattleInstancePokemon, BattleState } from "@data/BattleState.js";
import { createAccountNameMessage, createTeamSelectedMessage, EventType } from "@data/BattleMessages.js";
import { div, button, img } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import StatBar from "@components/StatBar.js";
import showToast from "@utils/ui/toast.js";

export default class BattleView extends BaseView {
	constructor(app, appState) {
		super(app);
		this.appState = appState;
		this.api = appState.getApi();
		this.rtc = appState.getBattleRtc();
		this.controller = null;
		this.battleState = null;
		this.isHost = null;
		this.opponentTeam = null;
		this.battleStarted = false;
		this.previousOpponentPokemon = null;
		this.previousYourPokemon = null;
		this.previousPhase = null;
		this.previousHasActed = null;
	}

	async render() {
		try {
			const player1Id = this.appState.getCurrentAccount();
			const player2Id = "Opponent";

			let myTeam = this.appState.getSelectedTeam();
			if (!myTeam || myTeam.length === 0) {
				const pokemon1 = await this.api.getPokemon(1); // Bulbasaur
				const pokemon2 = await this.api.getPokemon(4); // Charmander
				myTeam = [new Pokemon(pokemon1), new Pokemon(pokemon2)];
			}

			this.isHost = this.rtc.isHost;

			const player1Team = this.isHost ? myTeam : [];
			const player2Team = !this.isHost ? myTeam : [];

			const initialState = new BattleState(player1Id, player2Id, player1Team, player2Team);
			this.battleState = initialState;

			const inventory = this.appState.getInventory();
			this.controller = new BattleController(this.rtc, this.isHost, initialState, this.api, inventory);

			this.controller.onStateChange((state) => {
				this.battleState = state;
				this.#updateBattle();
			});
			this.controller.onResolveUsername((username) => {
				this.#renderOpponentSection(
					this.isHost ? this.battleState.player2.getActivePokemon() : this.battleState.player1.getActivePokemon(),
					username
				);
			});

			this.controller.onBattleEvent((event) => {
				this.#displayEventToast(event);
			});

			const accountName = this.appState.getCurrentAccountName();

			render(this.app,
				div({ className: 'flex flex-col flex-1' },
					div( { id: 'battle-container', className: 'flex-1 flex flex-col' },
						div({ className: 'flex-1 flex flex-col items-center justify-start pt-8' },
							div({ id: 'opponent-container', className: 'w-full max-w-sm flex flex-col items-center gap-2 px-4' },
								div({ className: 'text-gray-400 text-center py-8 animate-dots' }, 'Waiting for opponent')
							)
						),
						div({ className: 'flex-1 flex flex-col items-center justify-end pb-8' },
							div({ id: 'player-container', className: 'w-full max-w-sm flex flex-col items-center gap-2 px-4' })
						)),
					div({ id: 'action-container', className: 'p-4 border-t border-slate-700' })
				)
			);

			this.#renderPlayerTeam();
			if (this.isHost) {
				this.controller.webrtc.send(createAccountNameMessage(accountName));
				this.controller.webrtc.send(createTeamSelectedMessage(myTeam));
				await this.#waitForOpponentTeam();
			} else {
				const teamPromise = this.#waitForOpponentTeam();
				await teamPromise;
				this.controller.webrtc.send(createAccountNameMessage(accountName));
				this.controller.webrtc.send(createTeamSelectedMessage(myTeam));
			}
		} catch (error) {
			console.error('Error rendering BattleView:', error);
			render(this.app, div({}, `Error: ${error.message}`));
		}
	}

	#renderPlayerTeam() {
		const state = this.battleState;
		const yourPokemon = this.isHost ? state.player1.getActivePokemon() : state.player2.getActivePokemon();
		if (!yourPokemon) {
			console.warn('Player Pokemon not available yet');
			return;
		}
		const accountName = this.appState.getCurrentAccountName();
		this.#renderPlayerSection(yourPokemon, accountName);
	}

	async #waitForOpponentTeam() {
		if (this.opponentTeam && this.battleStarted) return;

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				console.warn('Team timeout after 10s');
				resolve();
			}, 10000);

			const originalSet = this.setOpponentTeam.bind(this);
			this.setOpponentTeam = (team) => {
				originalSet(team);
				clearTimeout(timeout);
				resolve();
			};
		});
	}

	setOpponentTeam(team) {
		this.opponentTeam = team;
		if (!this.battleStarted && this.battleState) {
			const battleInstanceTeam = team.map((p, idx) => new BattleInstancePokemon(p, idx));
			const playerOverride = { team: battleInstanceTeam };
			const overrides = this.isHost ? { player2: playerOverride } : { player1: playerOverride };
			this.battleState = this.battleState.clone(overrides);
			this.battleStarted = true;
			this.#updateBattle({ force: true });
		}
	}

	#updateBattle(options = {}) {
		const forceActionSection = options.forceActionSection ?? false;
		const forceOpponent = options.forceOpponent ?? false;
		const forcePlayer = options.forcePlayer ?? false;
		const force = options.force ?? false;
		const state = this.battleState;
		const yourPokemon = this.isHost ? state.player1.getActivePokemon() : state.player2.getActivePokemon();
		const opponentPokemon = this.isHost ? state.player2.getActivePokemon() : state.player1.getActivePokemon();
		const hasActed = this.isHost ? state.player1.hasActed : state.player2.hasActed;

		if (opponentPokemon && (force || forceOpponent || this.previousOpponentPokemon !== opponentPokemon || this.previousOpponentName !== this.controller.opponentName)) {
			this.#renderOpponentSection(opponentPokemon, this.controller.opponentName);
			this.previousOpponentPokemon = opponentPokemon;
			this.previousOpponentName = this.controller.opponentName;
		}

		if (yourPokemon && (force || forcePlayer || this.previousYourPokemon !== yourPokemon)) {
			const accountName = this.appState.getCurrentAccountName();
			this.#renderPlayerSection(yourPokemon, accountName);
			this.previousYourPokemon = yourPokemon;
		}

		if (yourPokemon && (force || forceActionSection || this.previousPhase !== state.phase || this.previousHasActed !== hasActed)) {
			this.#renderActionSection(state.phase, yourPokemon, hasActed);
			this.previousPhase = state.phase;
			this.previousHasActed = hasActed;
		}
	}

	#displayEventToast(event) {
		let text = '';
		let eventIsForOpponent;
		let player;
		let activePokemon;

		if (event.type === EventType.DAMAGE || event.type === EventType.STATUS_APPLY || event.type === EventType.STATUS_REMOVE || event.type === EventType.POKEMON_FAINTED) {
			const isTarget1 = event.target === 'player1';
			eventIsForOpponent = this.isHost ? !isTarget1 : isTarget1;
			player = isTarget1 ? this.battleState.player1 : this.battleState.player2;
		} else {
			eventIsForOpponent = this.isHost ? event.player === 1 : event.player === 0;
			player = event.player === 0 ? this.battleState.player1 : this.battleState.player2;
		}

		activePokemon = player ? player.getActivePokemon() : null;
		const position = eventIsForOpponent ? 'top-left' : 'bottom-right';
		const battleContainer = document.getElementById('battle-container');

		switch (event.type) {
			case EventType.MOVE_USED:
				if (activePokemon) {
					const moveInPool = activePokemon.movePool.find(m => this.api.getMoveId(m.move) === event.moveId);
					const moveName = moveInPool ? moveInPool.move.name : 'a move';
					text = `${activePokemon.name} used ${moveName}!`;
				} else text = 'A move was used!';
				break;
			case EventType.MOVE_MISSED:
				text = activePokemon ? `${activePokemon.name} missed!` : 'Attack missed!';
				break;
			case EventType.DAMAGE:
				text = activePokemon ? `${activePokemon.name} took ${event.amount} damage!` : `${event.amount} damage dealt!`;
				break;
			case EventType.POKEMON_FAINTED:
				text = activePokemon ? `${activePokemon.name} fainted!` : 'Pokémon fainted!';
				break;
			case EventType.STATUS_APPLY:
				text = activePokemon ? `${activePokemon.name} is now ${event.status}!` : `Pokémon is now ${event.status}!`;
				break;
			case EventType.STATUS_REMOVE:
				text = activePokemon ? `${activePokemon.name} is no longer ${event.status}.` : `Pokémon is no longer ${event.status}.`;
				break;
			case EventType.WEATHER_CHANGE:
				text = event.weatherType ? `Weather changed to ${event.weatherType}!` : 'Weather cleared!';
				break;
			case EventType.LEVEL_UP:
				text = activePokemon ? `${activePokemon.name} leveled up to Lv. ${event.newLevel}!` : `Pokémon leveled up to Lv. ${event.newLevel}!`;
				break;
			default:
				return;
		}

		if (text) {
			console.log(text);
			showToast({
				text,
				color: eventIsForOpponent ? 'bg-orange-600' : 'bg-blue-600',
				duration: 6000,
				position,
				parent: battleContainer || document.body
			});
		}
	}

	#renderOpponentSection(pokemon, opponentName) {
		if (!pokemon) return;
		const displayName = opponentName || 'Opponent';
		render('opponent-container',
			div({ className: 'text-white text-sm font-semibold text-gray-400' }, displayName),
			div({ className: 'text-white text-lg font-semibold' }, pokemon.name),
			StatBar(div({ className: 'w-full' }), {
				statName: 'HP',
				value: pokemon.currentHp,
				maxValue: pokemon.maxHp,
				showLabel: true,
				showValue: true,
				barHeight: 'h-2',
				gap: 'gap-0',
				colorThresholds: { red: 25, orange: 50, yellow: 75, green: 101 }
			}),
			img({ src: this.api.getPokemonImageUrl(pokemon.id), alt: pokemon.name, className: 'w-32 h-32' })
		);
	}

	#renderPlayerSection(pokemon, accountName) {
		if (!pokemon) return;
		render('player-container',
			div({ className: 'text-white text-sm font-semibold text-gray-400' }, accountName || 'You'),
			img({ src: this.api.getPokemonImageUrl(pokemon.id), alt: pokemon.name, className: 'w-32 h-32' }),
			StatBar(div({ className: 'w-full' }), {
				statName: 'HP',
				value: pokemon.currentHp,
				maxValue: pokemon.maxHp,
				showLabel: true,
				showValue: true,
				barHeight: 'h-2',
				gap: 'gap-0',
				colorThresholds: { red: 25, orange: 50, yellow: 75, green: 101 }
			}),
			div({ className: 'text-white text-lg font-semibold' }, pokemon.name)
		);
	}

	#renderActionSection(phase, pokemon, hasActed) {
		if (!pokemon) return;
		if (phase === 'selection') render('action-container',
			div({ className: 'grid grid-cols-2 gap-2' },
				...pokemon.movePool.slice(0, 4).map(move =>
					button({
						onClick: () => this.controller.selectMove(move, 0),
						disabled: hasActed,
						className: hasActed
							? 'px-4 py-2 rounded bg-gray-600 text-gray-400 font-semibold cursor-not-allowed'
							: 'px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition'
					}, move.move.name)
				)
			)
		);
		else render('action-container',
			div({ className: 'text-center text-gray-400' }, 'Turn resolving...')
		);
	}

	destroy() {
		if (this.controller) this.controller.close();
		this.app.innerHTML = '';
	}
}
