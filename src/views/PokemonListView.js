import PokemonCards from '@components/PokemonCards.js';
import ViewOpenerButton from '@components/ViewOpenerButton.js';
import BaseView from '@ui/BaseView.js';
import { div, input, option, select, span } from '@ui/dom.js';
import { icon } from "@ui/icons.js";
import { render } from '@ui/reactive.js';
import { applyAllFilters } from '@utils/filters.js';
import { capitalize } from '@utils/strings.js';
import MainMenuView from '@views/MainMenuView.js';
import { ArrowLeft } from "lucide";

export default class PokemonListView extends BaseView {
	constructor(app, appState, api) {
		super(app);
		this.api = api
		this.appState = appState;
		this.search = '';
		this.filters = {};
		this.fullPokemonList = [];
		this.types = [];
		this.generations = [];
		this.regions = [];
		this.abilities = [];
		this.colors = [];
		this.habitats = [];
		this.cardContainer = null;
	}

	#updatePokemon() {
		const pokemon = applyAllFilters(
			this.fullPokemonList,
			this.filters.type,
			this.filters.generation,
			this.filters.region,
			this.filters.ability,
			this.filters.color,
			this.filters.habitat
		);
		PokemonCards(this.cardContainer, { pokemon, search: this.search, api: this.api });
	}

	#filterSelect(name, getter, filterKey, options, optionValue = o => o.id, optionLabel = o => capitalize(o.realName || o.name)) {
		return select({
			className: 'rounded-lg border-2 border-gray-300 p-2 mr-4 mt-2',
			onChange: async (e) => {
				const value = e.target.value;
				this.filters[filterKey] = value === '' ? this.fullPokemonList : await getter(value);
				this.#updatePokemon();
			}
		}, option({ value: '' }, 'All ' + name), ...options.map(o => option({ value: optionValue(o) }, optionLabel(o))));
	}

	async #initializeData() {
		const totalCount = await this.api.getPokemonCount();
		this.fullPokemonList = await this.api.getAllPokemon(totalCount);

		this.types = await this.api.getTypes();

		this.generations = await this.api.getGenerations();
		for (const generation of this.generations) {
			generation.id = this.api.getGenerationId(generation);
			generation.realName = `Gen ${generation.id}`;
		}

		this.regions = await this.api.getRegions();

		const abilityCount = await this.api.getAbilityCount();
		this.abilities = await this.api.getAbilities(abilityCount);
		for (const ability of this.abilities) {
			ability.id = this.api.getAbilityId(ability);
		}

		this.colors = await this.api.getColors();
		for (const color of this.colors) {
			color.id = this.api.getColorId(color);
		}

		this.habitats = await this.api.getHabitats();
		for (const habitat of this.habitats) {
			habitat.id = this.api.getHabitatId(habitat);
		}

		this.filters = {
			type: this.fullPokemonList,
			generation: this.fullPokemonList,
			region: this.fullPokemonList,
			ability: this.fullPokemonList,
			color: this.fullPokemonList,
			habitat: this.fullPokemonList
		};
	}

	/**
	 * Renders the entire view
	 */
	async render() {
		await this.#initializeData();

		this.cardContainer = div({
			id: 'card-container',
			className: 'flex flex-col gap-4'
		});

		render(this.app,
			div({ className: 'p-4' },
				div({
						className: 'flex-col'
					},
				ViewOpenerButton(
					div({ className: 'mb-4' }),
					{
						label: div({ className: 'flex items-center justify-center gap-2' },
							icon(ArrowLeft, { className: 'w-4 h-4' }),
							'Back to Menu'
						),
						ViewClass: MainMenuView,
						appContainer: this.app,
						appState: this.appState,
						api: this.api,
						className: 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors'
					}
				),
					div({ className: 'flex items-center gap-4' },
						input({
							placeholder: 'Search...',
							onInput: (e) => {
								this.search = e.target.value;
								this.#updatePokemon();
							},
							className: 'w-full rounded-lg border-2 border-gray-300 p-2 flex items-center'
						}),
						span({ className: 'text-gray-400' }, `Total Pokémon: ${this.fullPokemonList.length}`)
					),
					div({
							id: 'filter-container',
						},
						this.#filterSelect(
							'types',
							async (type) => (await this.api.getType(type)).pokemon.map(p => p.pokemon),
							'type',
							this.types,
							t => t.name
						),
						this.#filterSelect(
							'generations',
							async (generation) => (await this.api.getGeneration(parseInt(generation, 10))).pokemon_species,
							'generation',
							this.generations
						),
						this.#filterSelect(
							'regions',
							async (region) => {
								const { pokedexes } = await this.api.getRegion(region);
								const pokedexDataList = await Promise.all(
									pokedexes.map(pokedex => this.api.getPokedex(this.api.getPokedexId(pokedex)))
								);
								const seenNames = new Set();
								return pokedexDataList.flatMap(data => data.pokemon_entries).filter(entry => {
									if (seenNames.has(entry.pokemon_species.name)) return false;
									seenNames.add(entry.pokemon_species.name);
									return true;
								}).map(entry => entry.pokemon_species);
							},
							'region',
							this.regions,
							r => r.name
						),
						this.#filterSelect(
							'abilities',
							async (ability) => (await this.api.getAbility(parseInt(ability))).pokemon.map(p => p.pokemon),
							'ability',
							this.abilities
						),
						this.#filterSelect(
							'colors',
							async (color) => (await this.api.getColor(parseInt(color))).pokemon_species,
							'color',
							this.colors
						),
						this.#filterSelect(
							'habitats',
							async (habitat) => (await this.api.getHabitat(parseInt(habitat))).pokemon_species,
							'habitat',
							this.habitats
						)
					)
				),
				this.cardContainer
			)
		);

		this.#updatePokemon();
	}

	/**
	 * Cleanup when the view is destroyed
	 */
	destroy() {
		// Any cleanup logic can go here
		this.app.innerHTML = '';
	}
}

