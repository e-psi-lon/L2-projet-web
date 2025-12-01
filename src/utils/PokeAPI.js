
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

	async getWithLimitAndOffset(resource, limit = 100, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `${resource}?limit=${limit}` : `${resource}?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	async getPokemonCount() {
		return (await this.get('pokemon?limit=1')).count;
	}

	async getAllPokemon(limit = 20, offset = 0) {
		return await this.getWithLimitAndOffset('pokemon', limit, offset);
	}

	async getPokemon(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.get(`pokemon/${id}`);
	}

	getPokemonId(pokemon) {
		if (typeof pokemon !== 'object' && typeof pokemon.url !== 'string') throw new Error('Invalid Pokémon object');
		return parseInt(pokemon.url.split('/').filter(Boolean).pop(), 10);
	}

	getPokemonImageUrl(pokemon) {
		const id = typeof pokemon === 'number' ? pokemon : this.getPokemonId(pokemon);
		return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
	}

	async getTypes(limit = 100, offset = 0) {
		return await this.getWithLimitAndOffset('type', limit, offset);
	}

	async getType(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.get(`type/${name}`);
	}

	async getGenerations(limit = 100, offset = 0) {
		return await this.getWithLimitAndOffset('generation', limit, offset);
	}

	getGenerationId(generation) {
		if (typeof generation !== 'object' && typeof generation.url !== 'string') throw new Error('Invalid generation object');
		return parseInt(generation.url.split('/').filter(Boolean).pop(), 10);
	}

	async getGeneration(number) {
		if (typeof number !== 'number') throw new Error('Must provide a number');
		return await this.get(`generation/${number}`);
	}

	async getRegions(limit = 100, offset = 0) {
		return await this.getWithLimitAndOffset('region', limit, offset);
	}

	async getRegion(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.get(`region/${name}`);
	}

	getPokedexId(pokedex) {
		if (typeof pokedex !== 'object' && typeof pokedex.url !== 'string') throw new Error('Invalid pokedex object');
		return parseInt(pokedex.url.split('/').filter(Boolean).pop(), 10);
	}

	async getPokedex(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.get(`pokedex/${id}`);
	}

	async getAbilityCount() {
		return (await this.get('ability?limit=1')).count;
	}

	async getAbilities(limit = 100, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `ability?limit=${limit}` : `ability?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	getAbilityId(ability) {
		if (typeof ability !== 'object' && typeof ability.url !== 'string') throw new Error('Invalid ability object');
		return parseInt(ability.url.split('/').filter(Boolean).pop(), 10);
	}

	async getAbility(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.get(`ability/${id}`);
	}

	async getColors(limit = 100, offset = 0)  {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `pokemon-color?limit=${limit}` : `ability?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	getColorId(color) {
		if (typeof color !== 'object' && typeof color.url !== 'string') throw new Error('Invalid color object');
		return parseInt(color.url.split('/').filter(Boolean).pop(), 10);
	}

	async getColor(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.get(`pokemon-color/${id}`);
	}

	async getHabitats(limit = 100, offset = 0)  {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `pokemon-habitat?limit=${limit}` : `ability?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	getHabitatId(habitat) {
		if (typeof habitat !== 'object' && typeof habitat.url !== 'string') throw new Error('Invalid habitat object');
		return parseInt(habitat.url.split('/').filter(Boolean).pop(), 10);
	}

	async getHabitat(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.get(`pokemon-habitat/${id}`);
	}
}