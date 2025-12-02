import Item from '@data/Item.js';

class InventoryManager {
	#pokemon = [];
	#items = new Map(); // Map<itemId, { item: Item, quantity: number }>
	#api = null;

	constructor(api = null) {
		this.#api = api;
	}


	addPokemon(pokemon) {
		if (this.#pokemon.length < 6) this.#pokemon.push(pokemon);
		else throw new Error('Inventory is full');
	}

	removePokemon(index) {
		if (index < 0 || index >= this.#pokemon.length)
			throw new Error('Invalid Pokemon index');
		this.#pokemon.splice(index, 1);
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
		for (const { item, quantity } of this.#items.values())
			items.push({ ...item.toJSON(), quantity });
		return items;
	}

	getItemsByCategory(category) {
		return this.getItems().filter(item => item.category === category);
	}

	hasItem(itemId, quantity = 1) {
		return this.getItemQuantity(itemId) >= quantity;
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
