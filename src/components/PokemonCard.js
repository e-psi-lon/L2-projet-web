import { div, h1, img } from '@ui/dom.js'
import { displayModal } from "@ui/modal.js";
import { render } from '@ui/reactive.js'
import { CARD_CLASSES } from "@utils/constants.js";
import { capitalize, titleCase } from '@utils/strings.js'
import PokemonDetailedDialog from "./dialogs/PokemonDetailedDialog.js";

const cardState = new Map(); // key: pokemon.id, value: { isHovering, timeoutId, pokemonData }


const updateDetails = (state, detailsContainer, cardDiv) => {
	if (state.isHovering)
		if (state.pokemonData)
			render(detailsContainer,
				div({},
					div({}, `Type: ${state.pokemonData.types.map(t => capitalize(t.type.name)).join(', ')}`),
					div({}, `Height: ${state.pokemonData.height / 10}m`),
					div({}, `Weight: ${state.pokemonData.weight / 10}kg`)
				)
			);
		else
			render(detailsContainer, div({}, 'Loading...'));
	else
		render(detailsContainer);
	if (cardDiv)
		cardDiv.className = state.isHovering ? `${CARD_CLASSES} scale-110` : CARD_CLASSES;
}

const PokemonCard = (parent, { pokemon, api }) => {
	const pokemonId = api.getPokemonId(pokemon);

	if (!cardState.has(pokemonId))
		cardState.set(pokemonId, { isHovering: false, timeoutId: null, pokemonData: null });
	const state = cardState.get(pokemonId);
	const detailsContainer = div({ className: 'text-center text-sm text-gray-300' });

	let cardDiv;

	const handleMouseEnter = () => {
		state.isHovering = true;
		updateDetails(state, detailsContainer, cardDiv);

		state.timeoutId = setTimeout(async () => {
			if (state.isHovering) {
				state.pokemonData = await api.getPokemon(pokemonId);
				updateDetails(state, detailsContainer, cardDiv);
			}
		}, 500);
	};

	const handleMouseLeave = () => {
		state.isHovering = false;
		if (state.timeoutId) clearTimeout(state.timeoutId);
		updateDetails(state, detailsContainer, cardDiv);
	};

	cardDiv = div({
			className: CARD_CLASSES,
			onMouseEnter: handleMouseEnter,
			onMouseLeave: handleMouseLeave,
			onClick: async () => {
				const detailedViewContainer = div({ className: 'w-full h-full' });
				displayModal({
					content: await PokemonDetailedDialog(detailedViewContainer, { pokemonId, api })
				});
			}
		},
		div({ className: 'flex flex-col items-center gap-2 p-4' },
			img({
				src: api.getPokemonImageUrl(pokemon),
				alt: `Image of ${titleCase(pokemon.name)} #${pokemonId}`,
				loading: 'lazy',
				className: 'w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden'
			}),
			h1({ className: 'text-center text-lg' }, titleCase(pokemon.name)),
			detailsContainer
		)
	);

	render(parent, cardDiv);

	return parent;
};

export default PokemonCard;