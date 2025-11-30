
export default class PokeAPI {
	baseUrl;
	cache;
	constructor() {
		this.baseUrl = 'https://pokeapi.co/api/v2/';
		this.cache = new Map();
	}

	async get(endpoint) {
		if (this.cache.has(endpoint)) return this.cache.get(endpoint);
		return await fetch(this.baseUrl + endpoint)
			.then(async (response) => {
				if (!response.ok) throw new Error(`HTTP error status: ${response.status}`);
				const data = await response.json();
				this.cache.set(endpoint, data);
				return data;
			})
			.catch(error => {
				console.error('Fetch error:', error);
				throw error;
			});
	}

	async getPokemonCount() {
		return (await this.get('pokemon?limit=1')).count;
	}

	async getAllPokemon(limit = 20, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `pokemon?limit=${limit}` : `pokemon?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	async getPokemon(id) {
		return await this.get(`pokemon/${id}`);
	}

	getPokemonId(pokemon) {
		return pokemon.url.split('/').filter(Boolean).pop();
	}

	getPokemonImageUrl(pokemon) {
		const id = typeof pokemon === 'number' ? pokemon : this.getPokemonId(pokemon);
		return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
	}

	async getTypes(limit = 100, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `type?limit=${limit}` : `type?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	async getType(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.get(`type/${name}`);
	}

	async getGenerations(limit = 100, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `generation?limit=${limit}` : `generation?limit=${limit}&offset=${offset}`;
		return await this.get('generation');
	}

	async getGeneration(number) {
		if (typeof number !== 'number') throw new Error('Number must be a number');
		return await this.get(`generation/${number}`);
	}

	async getRegions() {
		return await this.get('region');
	}

	async getRegion(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.get(`region/${name}`);
	}




}