import './style.css'
import PokeAPI from './PokeAPI.js'
import {div, h1, input, img, span, select, option} from './dom.js'
import { render } from './reactive.js'
import { CARD_CLASSES, FILTER_SELECT_CLASSES } from "./constants.js";

const app = document.querySelector('#app')
const api = new PokeAPI();


const cardState = new Map(); // key: pokemon.id, value: { isHovering, timeoutId, pokemonData }


const PokemonCard = (parent, p) => {
	const pokemonId = api.getPokemonId(p);

	if (!cardState.has(pokemonId)) {
		cardState.set(pokemonId, { isHovering: false, timeoutId: null, pokemonData: null });
	}
	const state = cardState.get(pokemonId);
	const detailsContainer = div({ className: 'text-center text-sm text-gray-300' });

	let cardDiv;
	const updateDetails = () => {
		if (state.isHovering) {
			if (state.pokemonData) {
				render(detailsContainer,
					div({},
						div({}, `Type: ${state.pokemonData.types.map(t => capitalize(t.type.name)).join(', ')}`),
						div({}, `Hauteur: ${state.pokemonData.height / 10}m`),
						div({}, `Poids: ${state.pokemonData.weight / 10}kg`)
					)
				);
			} else {
				render(detailsContainer, div({}, 'Chargement...'));
			}
		} else {
			render(detailsContainer);
		}
		if (cardDiv) {
			cardDiv.className = state.isHovering ? `${CARD_CLASSES} scale-110`: CARD_CLASSES;
		}
	};

	const handleMouseEnter = () => {
		state.isHovering = true;
		updateDetails();

		state.timeoutId = setTimeout(async () => {
			if (state.isHovering) {
				state.pokemonData = await api.getPokemon(pokemonId);
				updateDetails();
			}
		}, 500);
	};

	const handleMouseLeave = () => {
		state.isHovering = false;
		if (state.timeoutId) clearTimeout(state.timeoutId);
		updateDetails();
	};

	cardDiv = div({
			className: CARD_CLASSES,
			onMouseEnter: handleMouseEnter,
			onMouseLeave: handleMouseLeave
		},
		div({ className: 'flex flex-col items-center gap-2 p-4' },
			img({
				src: api.getPokemonImageUrl(p),
				alt: `Image de ${p.name}`,
				loading: 'lazy',
				className: 'w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden'
			}),
			h1({ className: 'text-center text-lg capitalize' }, p.name),
			detailsContainer
		)
	);

	render(parent, cardDiv);

	return parent;
};

const capitalize = (str) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const PokemonCards = (parent, pokemon, search) => {
	const filtered = pokemon.filter(p =>
		p.name.toLowerCase().includes(search.toLowerCase())
	);

	render(parent,
		h1({}, `Nombre de Pokémon correspondants : ${filtered.length}`),
		div({ className: 'mt-4' }),
		div({ className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
			...filtered.map(p => {
				return PokemonCard(div({ id: `pokemon-${api.getPokemonId(p)}` }), p);
			})
		)
	);

	return parent;
};

const pokemonToSet = (pokemonList) => {
	return new Set(pokemonList.map(p => p.name));
};

const applyAllFilter = (fullPokemon, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion) => {
	// Converting to sets make the lookup WAY faster
	const typeSet = pokemonToSet(pokemonOfCurrentType);
	const genSet = pokemonToSet(pokemonOfCurrentGeneration);
	const regionSet = pokemonToSet(pokemonOfCurrentRegion);

	return fullPokemon.filter(p =>
		typeSet.has(p.name) &&
		genSet.has(p.name) &&
		regionSet.has(p.name)
	);
}


(async () => {
	let search = '';
	const totalCount = await api.getPokemonCount();
	let fullPokemonLists = await api.getAllPokemon(totalCount);
	let pokemon = fullPokemonLists;
	const types = await api.getTypes();
	let pokemonOfCurrentType = pokemon;
	const generations = await api.getGenerations();
	for (const generation of generations) {
		generation.id = api.getGenerationId(generation);
		generation.realName = `Gen ${generation.id}`
	}
	let pokemonOfCurrentGeneration = pokemon;
	const regions = await api.getRegions();
	let pokemonOfCurrentRegion = pokemon;

	const cardContainer = div({
		id: 'card-container',
		className: 'flex flex-col gap-4'
	});

	render(app,
		div({ className: 'p-4' },
			div({
					className: 'flex-col'
				},
				div({ className: 'flex items-center gap-4 mb-2' },
					input({
						placeholder: 'Recherche...',
						onInput: (e) => {
							search = e.target.value;
							PokemonCards(cardContainer, pokemon, search);
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
								if (type === '') {
									pokemonOfCurrentType = fullPokemonLists;
									pokemon = applyAllFilter(fullPokemonLists, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion);
									PokemonCards(cardContainer, pokemon, search);
								} else {
									pokemonOfCurrentType = (await api.getType(type)).pokemon.map(p => p.pokemon);
									pokemon = applyAllFilter(fullPokemonLists, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion);
									PokemonCards(cardContainer, pokemon, search);
								}
						}
						},
						option({ value: '' }, 'Tous les types'),
						...types.map(t => option({ value: t.name }, capitalize(t.name)))
					),
					select({
						className: FILTER_SELECT_CLASSES,
						onChange: async (e) => {
							const generation = e.target.value;
							if (generation === '') {
								pokemonOfCurrentGeneration = fullPokemonLists;
								pokemon = applyAllFilter(fullPokemonLists, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion);
								PokemonCards(cardContainer, pokemon, search);
							} else {
								pokemonOfCurrentGeneration = (await api.getGeneration(parseInt(generation, 10))).pokemon_species;
								pokemon = applyAllFilter(fullPokemonLists, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion);
								PokemonCards(cardContainer, pokemon, search);
							}
						}
					},
						option({ value: '' }, 'Toutes les générations'),
						...generations.map(g => option({ value: g.id }, capitalize(g.realName)))
					),
					select({
						className: FILTER_SELECT_CLASSES,
						onChange: async (e) => {
							const region = e.target.value;
							if (region === '') {
								pokemon = fullPokemonLists;
								PokemonCards(cardContainer, pokemon, search);
							} else {
								const { pokedexes } = await api.getRegion(region);

								const pokedexDataList = await Promise.all(
									pokedexes.map(pokedex => api.getPokedex(api.getPokedexId(pokedex)))
								);
								const seenNames = new Set();
								pokemonOfCurrentRegion = pokedexDataList.flatMap(data => data.pokemon_entries).filter(entry => {
									if (seenNames.has(entry.pokemon_species.name)) return false;
									seenNames.add(entry.pokemon_species.name);
									return true;
								}).map(entry => entry.pokemon_species);
								pokemon = applyAllFilter(fullPokemonLists, pokemonOfCurrentType, pokemonOfCurrentGeneration, pokemonOfCurrentRegion);
								PokemonCards(cardContainer, pokemon, search);
							}
						}
					},
						option({ value: '' }, 'Toutes les régions'),
						...regions.map(r => option({ value: r.name }, capitalize(r.name)))
					)
				)
			),
			cardContainer
		)
	);

	PokemonCards(cardContainer, pokemon, search);
})();