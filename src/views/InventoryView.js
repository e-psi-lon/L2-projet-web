import BaseView from "@ui/BaseView.js";
import { div, button, h1, h2 } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import ViewOpenerButton from "@components/ViewOpenerButton.js";
import MainMenuView from "@views/MainMenuView.js";
import { INVENTORY_TABS } from "@utils/constants.js";

export default class InventoryView extends BaseView {
	constructor(app, appState) {
		super(app);
		this.app = app;
		this.appState = appState;
		this.api = appState.getApi();
		this.inventory = appState.getInventory();
		this.selectedTeam = this.inventory.getSelectedTeam();
		this.activeTab = 'collection'; // default tab
	}

	async render() {
		try {
			const inventory = this.appState.getInventory();
			const pokemonInInventory = inventory.getPokemon();
			const itemsInInventory = inventory.getItems();
			const itemsByCategory = {};
			INVENTORY_TABS.forEach(tab => {
				if (tab.categories)
					itemsByCategory[tab.id] = itemsInInventory.filter(i => 
						tab.categories.includes(i.item?.category || i.category)
					);
			});

			render(this.app,
				div({ className: 'flex flex-col flex-1' },
					div({ className: 'p-6 border-b border-gray-700' },
						h1({ className: 'text-3xl font-bold text-white' }, 'Inventory & Team'),
						div({ className: 'flex gap-0 mt-4 bg-gray-800 rounded-lg p-1 w-fit' },
							...INVENTORY_TABS.map((tab, index) =>
								button({
									className: `px-6 py-2 ${index === 0 ? 'rounded-l-md' : ''} ${index === INVENTORY_TABS.length - 1 ? 'rounded-r-md' : ''} font-semibold transition ${this.activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'} ${index > 0 ? 'border-l border-gray-700' : ''}`,
									onClick: () => this.#switchTab(tab.id)
								}, tab.label)
							)
						)
					),
					this.activeTab === 'collection'
						? this.#renderCollectionTab(pokemonInInventory)
						: this.#renderItemsTab(itemsByCategory[this.activeTab]),
					div({ className: 'p-4 border-t border-gray-700' },
						ViewOpenerButton(
							div(),
							{
								label: 'Back',
								ViewClass: MainMenuView,
								appContainer: this.app,
								appState: this.appState,
								className: 'px-4 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition'
							}
						)
					)
				)
			);
		} catch (error) {
			console.error('Error rendering InventoryView:', error);
			render(this.app, div({}, `Error: ${error.message}`));
		}
	}

	#renderCollectionTab(pokemonInInventory) {
		return div({ className: 'flex-1 flex gap-6 p-6 overflow-hidden' },
			div({ className: 'flex-1 flex flex-col' },
				h2({ className: 'text-xl font-bold text-white mb-4' }, 'Available Pokémon'),
				div({ className: 'flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4' },
					pokemonInInventory.length === 0
						? div({ className: 'text-gray-400 text-center py-8' }, 'No Pokémon in inventory. Add some to get started!')
						: div({ className: 'space-y-2' },
							...pokemonInInventory.map((pokemon) =>
								div({
									className: `flex items-center justify-between p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition ${this.selectedTeam.some(p => p === pokemon) ? 'border-2 border-green-500' : ''}`,
									onClick: () => this.#togglePokemonInTeam(pokemon)
								},
									div({ className: 'flex-1' },
										div({ className: 'text-white font-semibold' }, pokemon.name),
										div({ className: 'text-gray-400 text-sm' }, `Lvl ${pokemon.level}`)
									),
									div({ className: 'text-right text-gray-400 text-sm' },
										this.selectedTeam.includes(pokemon) ? '✓ Selected' : 'Click to add'
									)
								)
							)
						)
				)
			),
			// Team Preview
			div({ className: 'flex-1 flex flex-col' },
				h2({ className: 'text-xl font-bold text-white mb-4' }, `Battle Team (${this.selectedTeam.length}/6)`),
				div({ className: 'flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4' },
					this.selectedTeam.length === 0
						? div({ className: 'text-gray-400 text-center py-8' }, 'Select Pokémon to form your team')
						: div({ className: 'space-y-2' },
							...this.selectedTeam.map((pokemon, index) =>
								div({
									className: 'flex items-center justify-between p-4 bg-green-900 rounded-lg',
								},
									div({ className: 'flex-1' },
										div({ className: 'text-white font-semibold' }, `${index + 1}. ${pokemon.name}`),
										div({ className: 'text-gray-300 text-sm' }, `Lvl ${pokemon.level}`)
									),
									button({
										className: 'px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition',
										onClick: () => this.#removePokemonFromTeam(pokemon)
									}, 'Remove')
								)
							)
						)
				)
			)
		);
	}

	#renderItemsTab(items) {
		return div({ className: 'flex-1 p-6 overflow-hidden' },
			div({ className: 'h-full overflow-y-auto bg-gray-800 rounded-lg p-4' },
				items.length === 0
					? div({ className: 'text-gray-400 text-center py-8' }, 'No items in this category.')
					: div({ className: 'space-y-2' },
						...items.map((entry) =>
							div({
								className: 'flex items-center justify-between p-4 bg-gray-700 rounded-lg'
							},
								div({ className: 'flex-1' },
									div({ className: 'text-white font-semibold' }, entry.item?.name || entry.name),
									div({ className: 'text-gray-400 text-sm' }, entry.item?.description || entry.description || 'No description')
								),
								div({ className: 'text-white font-semibold' }, `x${entry.quantity}`)
							)
						)
					)
			)
		);
	}

	#switchTab(tab) {
		this.activeTab = tab;
		this.render();
	}

	#togglePokemonInTeam(pokemon) {
		const index = this.selectedTeam.indexOf(pokemon);
		if (index > -1) {
			this.selectedTeam.splice(index, 1);
		} else {
			if (this.selectedTeam.length < 6) {
				this.selectedTeam.push(pokemon);
			} else {
				alert('Your team is full! Max 6 Pokémon.');
				return;
			}
		}
		this.render();
	}

	#removePokemonFromTeam(pokemon) {
		const index = this.selectedTeam.indexOf(pokemon);
		if (index > -1) {
			this.selectedTeam.splice(index, 1);
			this.render();
		}
	}

	destroy() {
		this.inventory.setSelectedTeam(this.selectedTeam);
	}
}
