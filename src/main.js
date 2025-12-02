import './style.css'
import PokeAPI from '@utils/PokeAPI.js'
import { div, input, span, select, option } from '@ui/dom.js'
import { render } from '@ui/reactive.js'
import { FILTER_SELECT_CLASSES } from "@utils/constants.js";
import PokemonCards from '@components/PokemonCards.js'
import { applyAllFilters } from '@utils/filters.js'
import { capitalize } from "@utils/strings.js";

const app = document.querySelector('#app')
const api = new PokeAPI();



(async () => {
	let search = '';
	const totalCount = await api.getPokemonCount();
	const fullPokemonLists = await api.getAllPokemon(totalCount);
	let pokemon = fullPokemonLists;
	const types = await api.getTypes();
	const generations = await api.getGenerations();
	const regions = await api.getRegions();
	for (const generation of generations) {
		generation.id = api.getGenerationId(generation);
		generation.realName = `Gen ${generation.id}`
	}
	const abilityCount = await api.getAbilityCount();
	const abilities = await api.getAbilities(abilityCount);
	for (const ability of abilities) ability.id = api.getAbilityId(ability);
	const colors = await api.getColors();
	for (const color of colors) color.id = api.getColorId(color);
	const habitats = await api.getHabitats();
	for (const habitat of habitats) habitat.id = api.getHabitatId(habitat);

	let filterType = fullPokemonLists;
	let filterGeneration = fullPokemonLists;
	let filterRegion = fullPokemonLists;
	let filterAbility = fullPokemonLists;
	let filterColor = fullPokemonLists;
	let filterHabitat = fullPokemonLists;

	const cardContainer = div({
		id: 'card-container',
		className: 'flex flex-col gap-4'
	});

	const updatePokemon = () => {
		pokemon = applyAllFilters(fullPokemonLists, filterType, filterGeneration, filterRegion, filterAbility, filterColor, filterHabitat);
		PokemonCards(cardContainer, pokemon, search, api);
	};

	render(app,
		div({ className: 'p-4' },
			div({
					className: 'flex-col'
				},
				div({ className: 'flex items-center gap-4 mb-2' },
					input({
						placeholder: 'Search...',
						onInput: (e) => {
							search = e.target.value;
							updatePokemon();
						},
						className: 'w-full rounded-lg border-2 border-gray-300 p-2 flex items-center'
					}),
					span({ className: 'text-gray-400' }, `Total Pokémon: ${fullPokemonLists.length}`)
				),
				div({
						id: 'filter-container',
					},
					select({
						className: FILTER_SELECT_CLASSES,
						onChange: async (e) => {
								const type = e.target.value;
								filterType = type === '' ? fullPokemonLists : (await api.getType(type)).pokemon.map(p => p.pokemon);
								updatePokemon();
						}
						},
						option({ value: '' }, 'All types'),
						...types.map(t => option({ value: t.name }, capitalize(t.name)))
					),
					select({
						className: FILTER_SELECT_CLASSES,
						onChange: async (e) => {
							const generation = e.target.value;
							filterGeneration = generation === '' ? fullPokemonLists : (await api.getGeneration(parseInt(generation, 10))).pokemon_species;
							updatePokemon();
						}
					},
						option({ value: '' }, 'All generations'),
						...generations.map(g => option({ value: g.id }, capitalize(g.realName)))
					),
					select({
						className: FILTER_SELECT_CLASSES,
						onChange: async (e) => {
							const region = e.target.value;
							if (region === '') {
								filterRegion = fullPokemonLists;
							} else {
								const { pokedexes } = await api.getRegion(region);
								const pokedexDataList = await Promise.all(
									pokedexes.map(pokedex => api.getPokedex(api.getPokedexId(pokedex)))
								);
								const seenNames = new Set();
								filterRegion = pokedexDataList.flatMap(data => data.pokemon_entries).filter(entry => {
									if (seenNames.has(entry.pokemon_species.name)) return false;
									seenNames.add(entry.pokemon_species.name);
									return true;
								}).map(entry => entry.pokemon_species);
							}
							updatePokemon();
						}
					},
						option({ value: '' }, 'All regions'),
						...regions.map(r => option({ value: r.name }, capitalize(r.name)))
					),
					select({
							className: FILTER_SELECT_CLASSES,
							onChange: async (e) => {
								const ability = e.target.value;
								filterAbility = ability === '' ? fullPokemonLists : (await api.getAbility(parseInt(ability))).pokemon.map(p => p.pokemon);
								updatePokemon();
							}
						},
						option({ value: '' }, 'All abilities'),
						...abilities.map(a => option({ value: a.id }, capitalize(a.name)))
					),
					select({
							className: FILTER_SELECT_CLASSES,
							onChange: async (e) => {
								const color = e.target.value;
								filterColor = color === '' ? fullPokemonLists : (await api.getColor(parseInt(color))).pokemon_species;
								updatePokemon();
							}
						},
						option({ value: '' }, 'All colors'),
						...colors.map(c => option({ value: c.id }, capitalize(c.name)))
					),
					select({
							className: FILTER_SELECT_CLASSES,
							onChange: async (e) => {
								const habitat = e.target.value;
								filterHabitat = habitat === '' ? fullPokemonLists : (await api.getHabitat(parseInt(habitat))).pokemon_species;
								updatePokemon();
							}
						},
						option({ value: '' }, 'All habitats'),
						...habitats.map(h => option({ value: h.id }, capitalize(h.name)))
					)
				)
			),
			cardContainer
		)
	);

	updatePokemon();
	console.debug(`API calls made: ${api.apiCalls}`);
})();