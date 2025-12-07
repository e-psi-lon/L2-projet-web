import Item from '@data/Item.js';

class InventoryManager {
	#pokemon = [];
	#items = new Map(); // Map<itemId, { item: Item, quantity: number }>
	#api = null;
	#userId = null;
	#storageKey = null;
	#selectedTeam = [];

	constructor(userId, api = null) {
		this.#userId = userId;
		this.#api = api;
		this.#storageKey = `inventory-${userId}`;
		this.#loadFromStorage();
	}

	#loadFromStorage() {
		if (!this.#storageKey) return;
		try {
			const data = localStorage.getItem(this.#storageKey);
			if (!data) return;
			const { pokemon, items, selectedTeam } = JSON.parse(data);
			this.#pokemon = pokemon || [];
			this.#items = new Map(items || []);
			this.#selectedTeam = selectedTeam || [];
		} catch (error) {
			console.error('Failed to load inventory from storage:', error);
		}
	}

	#saveToStorage() {
		if (!this.#storageKey) return;
		try {
			const data = {
				pokemon: this.#pokemon,
				items: Array.from(this.#items.entries()),
				selectedTeam: this.#selectedTeam
			};
			localStorage.setItem(this.#storageKey, JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save inventory to storage:', error);
		}
	}

	addPokemon(pokemon) {
		if (this.#pokemon.length < 6) {
			this.#pokemon.push(pokemon);
			this.#saveToStorage();
		} else throw new Error('Inventory is full');
	}

	removePokemon(index) {
		if (index < 0 || index >= this.#pokemon.length)
			throw new Error('Invalid Pokemon index');
		this.#pokemon.splice(index, 1);
		this.#saveToStorage();
	}

	getPokemon() {
		return [...this.#pokemon];
	}

	getPokemonCount() {
		return this.#pokemon.length;
	}

	addItem(item, quantity = 1) {
		if (!(item instanceof Item))
			throw new Error('Must be an Item instance');
		if (quantity <= 0)
			throw new Error('Quantity must be greater than 0');
		if (!item.id)
			throw new Error('Item must have an id');

		const entry = this.#items.get(item.id);
		if (entry) entry.quantity += quantity;
		else this.#items.set(item.id, { item, quantity });
		this.#saveToStorage();
	}

	removeItem(itemId, quantity = 1) {
		const entry = this.#items.get(itemId);
		if (!entry)
			throw new Error(`Item not in inventory`);
		if (entry.quantity < quantity)
			throw new Error(`Not enough of item in inventory`);

		if (entry.quantity === quantity)
			this.#items.delete(itemId);
		else
			entry.quantity -= quantity;
		this.#saveToStorage();
	}

	getItemQuantity(itemId) {
		const entry = this.#items.get(itemId);
		return entry ? entry.quantity : 0;
	}

	getItem(itemId) {
		const entry = this.#items.get(itemId);
		return entry ? entry.item : null;
	}

	getItems() {
		const items = [];
		for (const { item, quantity } of this.#items.values()) {
			items.push({
				...item,
				quantity
			});
		}
		return items;
	}

	getItemsByCategory(category) {
		return this.getItems().filter(item => item.category === category);
	}

	hasItem(itemId, quantity = 1) {
		return this.getItemQuantity(itemId) >= quantity;
	}

	getSelectedTeam() {
		return [...this.#selectedTeam];
	}

	setSelectedTeam(team) {
		this.#selectedTeam = Array.isArray(team) ? [...team] : [];
		this.#saveToStorage();
	}

	async loadItemFromAPI(itemId) {
		if (!this.#api)
			throw new Error('No API instance provided to InventoryManager');

		const apiItem = await this.#api.getItem(itemId);
		return Item.fromAPIData(apiItem);
	}

	async addItemFromAPI(itemId, quantity = 1) {
		const item = await this.loadItemFromAPI(itemId);
		this.addItem(item, quantity);
	}
}

export default InventoryManager;
