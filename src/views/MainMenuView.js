import ViewOpenerButton from "@components/ViewOpenerButton.js";
import BaseView from "@ui/BaseView.js";
import { div, h1, h2, option, select, span } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { render } from "@ui/reactive.js";
import PokemonListView from "@views/PokemonListView.js";
import { Backpack, BookOpen, Sword } from 'lucide';

export default class MainMenuView extends BaseView {
	constructor(app, appState, api) {
		super(app);
		this.api = api
		this.appState = appState;
	}

	async render() {
		const buttonClassName = 'w-full px-6 py-4 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg';
		render(this.app,
			div({ className: 'min-h-screen flex flex-col' },
				div({ className: 'flex justify-between items-center p-6 border-b border-gray-700' },
					h1({ className: 'text-2xl font-bold text-white' }, 'Main Menu'),
					div({ className: 'flex items-center gap-3' },
						span({ className: 'text-gray-300 text-sm font-medium' }, 'Account:'),
						select({
								className: 'px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white cursor-pointer hover:border-gray-500 transition-colors',
								onChange: (e) => {
									this.appState.setCurrentAccount(e.target.value);
								}
							},
							option({ value: '' }, 'Select Account...'),
							...this.appState.getAccounts().map(account =>
								option({ value: account, selected: account === this.appState.getCurrentAccount() }, account)
							)
						)
					)
				),
				div({ className: 'flex-1 flex items-center justify-center p-4' },
					div({ className: 'flex flex-col gap-6 max-w-md w-full' },
						h2({ className: 'text-xl font-bold text-white text-center mb-4' }, 'Choose an Option'),
						div({
								className: `${buttonClassName} bg-gradient-to-r from-red-600 to-red-700 opacity-50 cursor-not-allowed flex items-center justify-center gap-3`,
								title: 'Battles system not yet implemented'
							},
							icon(Sword, { className: 'w-6 h-6' }),
							span({}, 'Battles')
						),
						div({
								className: `${buttonClassName} bg-gradient-to-r from-blue-600 to-blue-700 opacity-50 cursor-not-allowed flex items-center justify-center gap-3`,
								title: 'Inventory system not yet implemented'
							},
							icon(Backpack, { className: 'w-6 h-6' }),
							span({}, 'Inventory')
						),
					ViewOpenerButton(
						div(),
						{
							label: div({ className: 'flex items-center justify-center gap-3' },
								icon(BookOpen, { className: 'w-6 h-6' }),
								span({}, 'Pokédex')
							),
							ViewClass: PokemonListView,
							appContainer: this.app,
							appState: this.appState,
							api: this.api,
							className: `${buttonClassName} bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600`
						}
					)
					)
				)
			)
		);

	}

	destroy() {
		this.app.innerHTML = '';
	}
}