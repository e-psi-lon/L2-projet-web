
export default class PokeAPI {
	baseUrl;
	cache;
	apiCalls;
	constructor() {
		this.baseUrl = 'https://pokeapi.co/api/v2/';
		this.cache = new Map();
		this.apiCalls = 0;
	}

	async get(endpoint) {
		if (this.cache.has(endpoint)) return this.cache.get(endpoint);
		this.apiCalls++;
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

	async #getWithLimitAndOffset(resource, limit = 100, offset = 0) {
		if (typeof limit !== 'number' || limit <= 0) throw new Error('Limit must be a positive number');
		if (typeof offset !== 'number' || offset < 0) throw new Error('Offset must be a non-negative number');
		const endpoint = offset === 0 ? `${resource}?limit=${limit}` : `${resource}?limit=${limit}&offset=${offset}`;
		return (await this.get(endpoint)).results;
	}

	#extractId(obj, errorMessage = 'Invalid object - must have a url property') {
		if (typeof obj !== 'object' || typeof obj.url !== 'string') throw new Error(errorMessage);
		return parseInt(obj.url.split('/').filter(Boolean).pop(), 10);
	}

	#getSingle(resource, identifier) {
		const endpoint = typeof identifier === 'number' ? `${resource}/${identifier}` : `${resource}/${identifier}`;
		return this.get(endpoint);
	}

	async getPokemonCount() {
		return (await this.get('pokemon?limit=1')).count;
	}

	async getAllPokemon(limit = 20, offset = 0) {
		return await this.#getWithLimitAndOffset('pokemon', limit, offset);
	}

	async getPokemon(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('pokemon', id);
	}

	getPokemonId(pokemon) {
		return this.#extractId(pokemon, 'Invalid Pokémon object');
	}

	getPokemonImageUrl(pokemon) {
		const id = typeof pokemon === 'number' ? pokemon : this.getPokemonId(pokemon);
		return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
	}

	async getTypes(limit = 100, offset = 0) {
		return await this.#getWithLimitAndOffset('type', limit, offset);
	}

	async getType(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.#getSingle('type', name);
	}

	async getGenerations(limit = 100, offset = 0) {
		return await this.#getWithLimitAndOffset('generation', limit, offset);
	}

	getGenerationId(generation) {
		return this.#extractId(generation, 'Invalid generation object');
	}

	async getGeneration(number) {
		if (typeof number !== 'number') throw new Error('Must provide a number');
		return await this.#getSingle('generation', number);
	}

	async getRegions(limit = 100, offset = 0) {
		return await this.#getWithLimitAndOffset('region', limit, offset);
	}

	async getRegion(name) {
		if (typeof name !== 'string') throw new Error('Name must be a string');
		return await this.#getSingle('region', name);
	}

	getPokedexId(pokedex) {
		return this.#extractId(pokedex, 'Invalid pokedex object');
	}

	async getPokedex(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('pokedex', id);
	}

	async getAbilityCount() {
		return (await this.get('ability?limit=1')).count;
	}

	async getAbilities(limit = 100, offset = 0) {
		return await this.#getWithLimitAndOffset('ability', limit, offset);
	}

	getAbilityId(ability) {
		return this.#extractId(ability, 'Invalid ability object');
	}

	async getAbility(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('ability', id);
	}

	async getColors(limit = 100, offset = 0)  {
		return await this.#getWithLimitAndOffset('pokemon-color', limit, offset);
	}

	getColorId(color) {
		return this.#extractId(color, 'Invalid color object');
	}

	async getColor(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('pokemon-color', id);
	}

	async getHabitats(limit = 100, offset = 0)  {
		return await this.#getWithLimitAndOffset('pokemon-habitat', limit, offset);
	}

	getHabitatId(habitat) {
		return this.#extractId(habitat, 'Invalid habitat object');
	}

	async getHabitat(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('pokemon-habitat', id);
	}

	async getPokemonSpecies(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('pokemon-species', id);
	}

	async getEvolutionChain(id) {
		if (typeof id !== 'number') throw new Error('ID must be a number');
		return await this.#getSingle('evolution-chain', id);
	}

	getEvolutionChainId(chain) {
		return this.#extractId(chain, 'Invalid evolution chain object');
	}
}