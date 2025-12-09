class Pokemon {
	constructor(apiData, level = null, xp = null) {
		this.id = apiData.id;
		this.name = apiData.name;
		this.instanceId = apiData.instanceId || crypto.randomUUID();
		const baseExp = apiData.base_experience || 0;
		
		if (level === null || level === undefined)
			this.level = Math.max(1, Math.min(100, Math.floor(Math.cbrt(baseExp) + 1)));
		else this.level = level;
	
		if (xp !== null && xp !== undefined) this.xp = xp;
		else this.xp = Math.ceil(baseExp / 5);
	
		
		this.types = (apiData.types || []).map(t => t.type.name);
		this.stats = {};
		(apiData.stats || []).forEach(stat => {
			this.stats[stat.stat.name] = stat.base_stat;
		});
		
		this.movePool = apiData.moves || [];

		this._apiData = apiData;
	}

	getStat(statName) {
		return this.stats[statName] || 0;
	}

	getPrimaryType() {
		return this.types[0] || 'normal';
	}

	gainXp(amount) {
		if (this.level >= 100) return null;
		this.xp += amount;
		const xpNeeded = Math.ceil(100 * Math.pow(1.1, this.level - 1));
		
		if (this.xp >= xpNeeded) {
			this.xp -= xpNeeded;
			this.level = Math.min(100, this.level + 1);
			return this.level;
		}
		
		return null;
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

	toJSON() {
		return {
			id: this.id,
			instanceId: this.instanceId,
			name: this.name,
			level: this.level,
			xp: this.xp,
			types: this.types,
			stats: this.stats,
			movePool: this.movePool
		};
	}

	static fromJSON(data) {
		const apiData = {
			id: data.id,
			instanceId: data.instanceId,
			name: data.name,
			types: data.types.map(type => 
				typeof type === 'string' 
					? { type: { name: type } }
					: type
			),
			stats: Object.entries(data.stats).map(([name, base_stat]) => ({
				stat: { name },
				base_stat
			})),
			moves: data.movePool || []
		};
		return new Pokemon(apiData, data.level, data.xp || 0);
	}
}

export default Pokemon;

