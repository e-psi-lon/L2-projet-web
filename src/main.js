import './style.css'
import PokeAPI from './PokeAPI.js'
import {div, h1, input, img, span} from './dom.js'
import { render } from './reactive.js'

const app = document.querySelector('#app')
const api = new PokeAPI();

let pokemon = [];
let search = '';
const cardClasses = "border border-white/20 rounded-lg bg-white/5 cursor-pointer origin-center transition-transform duration-200"

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
						div({}, `Type: ${state.pokemonData.types.map(t => t.type.name).join(', ')}`),
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
			cardDiv.className = state.isHovering ? `${cardClasses} scale-110`: cardClasses;
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
			className: cardClasses,
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

const PokemonCards = (parent) => {
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

(async () => {
	const totalCount = await api.getPokemonCount();
	pokemon = await api.getAllPokemon(totalCount);

	const cardContainer = div({
		id: 'card-container',
		className: 'flex flex-col gap-4'
	});

	render(app,
		div({ className: 'p-4' },
			div({ className: 'flex items-center gap-4 mb-2' },
				input({
					placeholder: 'Recherche...',
					onInput: (e) => {
						search = e.target.value;
						PokemonCards(cardContainer);
					},
					className: 'w-full rounded-lg border-2 border-gray-300 p-2 flex items-center'
				}),
				span({ className: 'text-gray-400' }, `Total Pokémon: ${pokemon.length}`)
			),
			cardContainer
		)
	);

	PokemonCards(cardContainer);
})();