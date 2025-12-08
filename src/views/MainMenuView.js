import ViewOpenerButton from "@components/ViewOpenerButton.js";
import NewAccountDialog from "@dialogs/NewAccountDialog.js";
import MustLoginDialog from "@dialogs/MustLoginDialog.js";
import WildEncounterDialog, { getWildEncounterCooldownRemaining } from "@dialogs/WildEncounterDialog.js";
import ItemFindDialog, { getItemFindCooldownRemaining } from "@dialogs/ItemFindDialog.js";
import BaseView from "@ui/BaseView.js";
import { button, div, h1, h2, option, select, span } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { displayDialog } from "@ui/dialog.js";
import { render } from "@ui/rendering.js";
import { formatTime } from "@utils/strings.js";
import PokemonListView from "@views/PokemonListView.js";
import LobbyView from "@views/LobbyView.js";
import InventoryView from "@views/InventoryView.js";
import { Backpack, BookOpen, Sword, Sparkles, Search, Gift } from 'lucide';

export default class MainMenuView extends BaseView {
	constructor(app, appState) {
		super(app);
		this.api = appState.getApi();
		this.appState = appState;
		this.rateLimitUpdateTimer = null;
	}

	#accountSelector(parent) {
		const isLoggedIn = this.appState.getCurrentAccount() !== null;
  		render(parent,
		    span({ className: 'text-gray-300 text-sm font-medium hidden md:block' }, 'Account:'),
			select({
					className: 'px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white cursor-pointer hover:border-gray-500 transition-colors',
					onChange: async (e) => {
						if (e.target.value === '$new') await displayDialog({
							DialogComponentOrContent: NewAccountDialog,
							onClose: async (div, reason) => {
								if (reason === 'cancel') return;
								const accountName = div.querySelector('input').value.trim();
								if (accountName && accountName !== '') {
									const account = this.appState.addAccount(accountName);
									this.appState.setCurrentAccount(account.id);
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
					option({ value: account.id, selected: account.id === this.appState.getCurrentAccount() }, account.name)
				),
				option({ value: '$new' }, 'Create New Account')
			)
		)
		return parent;
	}

	async render() {
		const buttonClassName = 'w-full px-6 py-4 rounded-lg text-white font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg';
		const smallButtonClass = 'px-3 py-2 text-sm font-semibold rounded-lg text-white transition-all transform hover:scale-105 active:scale-95 shadow-md';
		const updateRateLimitDisplay = (container) => {
			const accountId = this.appState.getCurrentAccount();
			const encounterRemaining = accountId ? getWildEncounterCooldownRemaining(accountId) : 0;
			const itemRemaining = accountId ? getItemFindCooldownRemaining(accountId) : 0;
			render(container,
				div({ className: 'fixed bottom-4 right-4 flex flex-col gap-2 text-xs md:text-sm' },
					div({
						className: `px-3 py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
							encounterRemaining > 0 
								? 'bg-orange-600/80 cursor-not-allowed' 
								: 'bg-green-600/80'
						}`
					},
						icon(Search, { className: 'w-4 h-4' }),
						span({}, formatTime(encounterRemaining))
					),
					div({
						className: `px-3 py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
							itemRemaining > 0 
								? 'bg-orange-600/80 cursor-not-allowed' 
								: 'bg-green-600/80'
						}`
					},
						icon(Gift, { className: 'w-4 h-4' }),
						span({}, formatTime(itemRemaining))
					)
				)
			);
			if (encounterRemaining > 0 || itemRemaining > 0) {
				if (this.rateLimitUpdateTimer) clearTimeout(this.rateLimitUpdateTimer);
				this.rateLimitUpdateTimer = setTimeout(() => updateRateLimitDisplay(container), 1000);
			}
		};
		
		const rateLimitContainer = div({});
		
		render(this.app,
			div({ className: 'min-h-screen flex flex-col relative' },
				div({ className: 'flex justify-between items-center p-6 border-b border-gray-700' },
					h1({ className: 'text-2xl font-bold text-white' }, 'Main Menu'),
					this.#accountSelector(div({ className: 'flex items-center gap-3' }))
				),
				div({ className: 'flex-1 flex items-center justify-center p-4' },
					div({ className: 'flex flex-col gap-6 max-w-md w-full' },
						h2({ className: 'text-xl font-bold text-white text-center mb-4' }, 'Choose an Option'),
						ViewOpenerButton(
							div(),
							{
								label: div({ className: 'flex items-center justify-center gap-3' },
									icon(Sword, { className: 'w-6 h-6' }),
									span({}, 'Battles')
								),
								ViewClass: LobbyView,
								appContainer: this.app,
								appState: this.appState,
								requiresLogin: true,
								className: `${buttonClassName} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600`
							}
						),
						ViewOpenerButton(
							div(),
							{
								label: div({ className: 'flex items-center justify-center gap-3' },
									icon(Backpack, { className: 'w-6 h-6' }),
									span({}, 'Inventory')
								),
								ViewClass: InventoryView,
								appContainer: this.app,
								appState: this.appState,
								requiresLogin: true,
								className: `${buttonClassName} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600`
							}
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
								className: `${buttonClassName} bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600`
							}
						),
						div({ className: 'flex gap-3' },
							button({
								className: `flex-1 ${smallButtonClass} bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 flex items-center justify-center gap-2`,
								disabled: this.appState.getCurrentAccount() === null || (this.appState.getCurrentAccount() && getWildEncounterCooldownRemaining(this.appState.getCurrentAccount()) > 0),
								onClick: async () => {
									if (this.appState.getCurrentAccount() === null) {
										await displayDialog({
											DialogComponentOrContent: MustLoginDialog
										});
										return;
									}
									await displayDialog({
										DialogComponentOrContent: WildEncounterDialog,
										onClose: () => {
											updateRateLimitDisplay(rateLimitContainer);
										}
									}, { api: this.api, appState: this.appState });
									updateRateLimitDisplay(rateLimitContainer);
								}
							},
								icon(Sparkles, { className: 'w-4 h-4' }),
								span({}, 'Find Pokémon')
							),
							button({
								className: `flex-1 ${smallButtonClass} bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 flex items-center justify-center gap-2`,
								disabled: this.appState.getCurrentAccount() === null || (this.appState.getCurrentAccount() && getItemFindCooldownRemaining(this.appState.getCurrentAccount()) > 0),
								onClick: async () => {
									if (this.appState.getCurrentAccount() === null) {
										await displayDialog({
											DialogComponentOrContent: MustLoginDialog
										});
										return;
									}
									await displayDialog({
										DialogComponentOrContent: ItemFindDialog,
										onClose: () => {
											updateRateLimitDisplay(rateLimitContainer);
										}
									}, { api: this.api, appState: this.appState });
									updateRateLimitDisplay(rateLimitContainer);
								}
							},
								icon(Gift, { className: 'w-4 h-4' }),
								span({}, 'Find Items')
							)
						)
					)
				),
				rateLimitContainer
			)
		);
		updateRateLimitDisplay(rateLimitContainer);
		this.appState.onAccountChange((accountId) => {
			updateRateLimitDisplay(rateLimitContainer);
		});
	}

	destroy() {
		this.app.innerHTML = '';
		if (this.rateLimitUpdateTimer) clearTimeout(this.rateLimitUpdateTimer);
	}
}