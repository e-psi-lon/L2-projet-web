class Pokemon {
	constructor(apiData, level = null) {
		this.id = apiData.id;
		this.name = apiData.name;
		if (level === null || level === undefined) {
			const baseExp = apiData.base_experience || 0;
			this.level = Math.max(1, Math.min(100, Math.floor(Math.cbrt(baseExp) + 1)));
		} else this.level = level;
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

