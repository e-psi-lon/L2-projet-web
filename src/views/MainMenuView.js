import ViewOpenerButton from "@components/ViewOpenerButton.js";
import NewAccountDialog from "@dialogs/NewAccountDialog.js";
import BaseView from "@ui/BaseView.js";
import { div, h1, h2, option, select, span } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { displayDialog } from "@ui/dialog.js";
import { render } from "@ui/reactive.js";
import PokemonListView from "@views/PokemonListView.js";
import { Backpack, BookOpen, Sword } from 'lucide';

export default class MainMenuView extends BaseView {
	constructor(app, appState, api) {
		super(app);
		this.api = api
		this.appState = appState;
	}

	#accountSelector(parent) {
		const isLoggedIn = this.appState.getCurrentAccount() !== null;
  		render(parent,
		    span({ className: 'text-gray-300 text-sm font-medium' }, 'Account:'),
			select({
					className: 'px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white cursor-pointer hover:border-gray-500 transition-colors',
					onChange: async (e) => {
						if (e.target.value === '__new__') await displayDialog({
							DialogComponentOrContent: NewAccountDialog,
							onClose: async (div) => {
								const account = div.querySelector('input').value.trim();
								if (account && account !== '') {
									this.appState.addAccount(account);
									this.appState.setCurrentAccount(account);
									console.log(this.appState.getAccounts());
								}
								this.#accountSelector(parent);
							}
						});
						else this.appState.setCurrentAccount(e.target.value);
						this.#accountSelector(parent);
					}
				},
				option({ value: '', disabled: true, selected: !isLoggedIn, hidden: true }, 'Select Account...'),
				...this.appState.getAccounts().map(account =>
					option({ value: account, selected: account === this.appState.getCurrentAccount() }, account)
				),
				option({ value: '__new__' }, 'Create New Account')
			)
		)
		return parent;
	}

	async render() {
		const buttonClassName = 'w-full px-6 py-4 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg';
		render(this.app,
			div({ className: 'min-h-screen flex flex-col' },
				div({ className: 'flex justify-between items-center p-6 border-b border-gray-700' },
					h1({ className: 'text-2xl font-bold text-white' }, 'Main Menu'),
					this.#accountSelector(div({ className: 'flex items-center gap-3' }))
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