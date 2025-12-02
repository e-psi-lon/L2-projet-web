class Item {
	constructor({
		id,
		name,
		category,
		cost = 0,
		attributes = [],
		effect = null,
		shortEffect = null,
		description = ''
	}) {
		this.id = id;
		this.name = name;
		this.category = category;
		this.cost = cost;
		this.attributes = attributes;
		this.effect = effect;
		this.shortEffect = shortEffect || description;
		this.description = description;
	}

	static fromAPIData(apiItem) {
		const englishEffect = apiItem.effect_entries?.find(
			e => e.language.name === 'en'
		);
		const categoryName = apiItem.category?.name || 'other';
		const attributeNames = apiItem.attributes?.map(a => a.name) || [];

		return new Item({
			id: apiItem.id,
			name: apiItem.name,
			category: categoryName,
			cost: apiItem.cost || 0,
			attributes: attributeNames,
			effect: englishEffect?.effect || '',
			shortEffect: englishEffect?.short_effect || 'Unknown effect',
			description: englishEffect?.short_effect || 'An item with unknown properties'
		});
	}

	static async fromAPI(api, itemId) {
		const apiItem = await api.getItem(itemId);
		return Item.fromAPIData(apiItem);
	}

	getRarity() {
		if (this.cost === 0) return 'legendary'; // Free items are rare!
		if (this.cost >= 5000) return 'epic';
		if (this.cost >= 1000) return 'rare';
		if (this.cost >= 300) return 'uncommon';
		return 'common';
	}

	isConsumable() {
		return this.attributes.includes('consumable');
	}

	isHoldable() {
		return this.attributes.includes('holdable');
	}

	isUsableInBattle() {
		return this.attributes.includes('usable-in-battle');
	}

	isUsableOverworld() {
		return this.attributes.includes('usable-overworld');
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			category: this.category,
			cost: this.cost,
			attributes: this.attributes,
			shortEffect: this.shortEffect,
			rarity: this.getRarity(),
			consumable: this.isConsumable(),
			holdable: this.isHoldable()
		};
	}
}

export default Item;

