import BaseView from "@ui/BaseView.js";
import BattleController from "@utils/BattleController.js";
import { BattleState } from "@utils/data/BattleState.js";
import Pokemon from "@utils/data/Pokemon.js";
import { createAccountNameMessage } from "@utils/data/BattleMessages.js";
import { div, button, img } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import StatBar from "@components/StatBar.js";

export default class BattleView extends BaseView {
	constructor(app, appState, api) {
		super(app);
		this.appState = appState;
		this.api = api;
		this.rtc = appState.getBattleRtc();
		this.controller = null;
		this.battleState = null;
		this.isHost = null;
		this.previousOpponentPokemon = null;
		this.previousYourPokemon = null;
		this.previousPhase = null;
		this.previousHasActed = null;
	}

	async render() {
		try {
			const player1Id = this.appState.getCurrentAccount();
			const player2Id = "Opponent";

			const pokemon1Data = await this.api.getPokemon(1);
			const pokemon4Data = await this.api.getPokemon(4);
			const pokemon7Data = await this.api.getPokemon(7);
			const pokemon25Data = await this.api.getPokemon(25);

			const player1Team = [
				new Pokemon(pokemon1Data),
				new Pokemon(pokemon4Data)
			];
			const player2Team = [
				new Pokemon(pokemon7Data),
				new Pokemon(pokemon25Data)
			];

			console.log('Team 1:', player1Team.map(p => ({ name: p.name, movePool: p.movePool })));
			console.log('Team 2:', player2Team.map(p => ({ name: p.name, movePool: p.movePool })));

			const initialState = new BattleState(player1Id, player2Id, player1Team, player2Team);
			this.battleState = initialState;
			this.isHost = this.rtc.isHost;

			this.controller = new BattleController(this.rtc, this.isHost, initialState, this.api);

			this.controller.onStateChange((state) => {
				this.battleState = state;
				console.log('Battle state changed:', JSON.stringify(state, null, 2));
				this.#updateBattle();
			});
			this.controller.onResolveUsername((username) => {
				console.log('Resolved opponent username:', username);
				this.#renderOpponentSection(
					this.isHost ? this.battleState.player2.getActivePokemon() : this.battleState.player1.getActivePokemon(),
					username
				);
			});

			const accountName = this.appState.getCurrentAccountName();
			this.controller.webrtc.send(createAccountNameMessage(accountName));

			render(this.app,
				div({ className: 'min-h-screen flex flex-col' },
					div({ className: 'flex-1 flex flex-col items-center justify-start pt-8' },
						div({ id: 'opponent-container', className: 'w-full max-w-sm flex flex-col items-center gap-2 px-4' })
					),
					div({ className: 'flex-1 flex flex-col items-center justify-end pb-8' },
						div({ id: 'player-container', className: 'w-full max-w-sm flex flex-col items-center gap-2 px-4' })
					),
					div({ id: 'action-container', className: 'p-4 border-t border-slate-700' })
				)
			);

			this.#updateBattle();
		} catch (error) {
			console.error('Error rendering BattleView:', error);
			render(this.app, div({}, `Error: ${error.message}`));
		}
	}

	#updateBattle() {
		const state = this.battleState;
		const yourPokemon = this.isHost ? state.player1.getActivePokemon() : state.player2.getActivePokemon();
		const opponentPokemon = this.isHost ? state.player2.getActivePokemon() : state.player1.getActivePokemon();
		const hasActed = this.isHost ? state.player1.hasActed : state.player2.hasActed;

		if (this.previousOpponentPokemon !== opponentPokemon || this.previousOpponentName !== this.controller.opponentName) {
			this.#renderOpponentSection(opponentPokemon, this.controller.opponentName);
			this.previousOpponentPokemon = opponentPokemon;
			this.previousOpponentName = this.controller.opponentName;
		}

		if (this.previousYourPokemon !== yourPokemon) {
			const accountName = this.appState.getCurrentAccountName();
			this.#renderPlayerSection(yourPokemon, accountName);
			this.previousYourPokemon = yourPokemon;
		}
		if (this.previousPhase !== state.phase || this.previousHasActed !== hasActed) {
			this.#renderActionSection(state.phase, yourPokemon, hasActed);
			this.previousPhase = state.phase;
			this.previousHasActed = hasActed;
		}
	}

	#renderOpponentSection(pokemon, opponentName) {
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
				gap: 'gap-0'
			}),
			img({ src: this.api.getPokemonImageUrl(pokemon.id), alt: pokemon.name, className: 'w-32 h-32' })
		);
	}

	#renderPlayerSection(pokemon, accountName) {
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
				gap: 'gap-0'
			}),
			div({ className: 'text-white text-lg font-semibold' }, pokemon.name)
		);
	}

	#renderActionSection(phase, pokemon, hasActed) {
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
