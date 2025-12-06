class Pokemon {
	constructor(apiData, level = 100) {
		this.id = apiData.id;
		this.name = apiData.name;
		this.level = level;
		this.types = (apiData.types || []).map(t => t.type.name);
		this.stats = {};
		(apiData.stats || []).forEach(stat => {
			this.stats[stat.stat.name] = stat.base_stat;
		});
		
		// Available moves
		this.movePool = apiData.moves || [];

		this._apiData = apiData;
	}

	getStat(statName) {
		return this.stats[statName] || 0;
	}

	getPrimaryType() {
		return this.types[0] || 'normal';
	}

	createBattleInstance() {
		return {
			pokemon: this,
			currentHp: this.getStat('hp'),
			maxHp: this.getStat('hp'),
			status: null,
			isFainted: false
		};
	}
	toString() {
		return `${this.name} (#${this.id}) [${this.types.join('/')}]`;
	}
}

export default Pokemon;

