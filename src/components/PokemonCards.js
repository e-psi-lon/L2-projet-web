import { div, h1 } from '@ui/dom.js'
import { render } from '@ui/reactive.js'
import PokemonCard from './PokemonCard.js'

const PokemonCards = (parent, { pokemon, search, api }) => {
	const filtered = pokemon.filter(p =>
		p.name.toLowerCase().includes(search.toLowerCase())
	);

	render(parent,
		h1({}, `Corresponding Pokemon count : ${filtered.length}`),
		div({ className: 'mt-4' }),
		div({ className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
			...filtered.map(p => {
				return PokemonCard(div({ id: `pokemon-${api.getPokemonId(p)}` }), { pokemon: p, api });
			})
		)
	);

	return parent;
};

export default PokemonCards;

