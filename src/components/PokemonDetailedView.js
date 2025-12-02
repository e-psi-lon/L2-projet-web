import { div, img, h2, h3, span, p, strong, button } from '@ui/dom.js';
import { render } from '@ui/reactive.js';
import { titleCase, capitalize } from '../utils/strings.js';
import { ChevronLeft, ChevronRight } from 'lucide';
import { icon } from '@ui/icons.js';

const getStatColor = (value) => {
	if (value < 50) return 'bg-red-500';
	if (value < 80) return 'bg-yellow-500';
	if (value < 110) return 'bg-green-500';
	return 'bg-blue-500';
};

const StatBar = (statName, value) => {
	const percentage = (value / 180) * 100;
	return div({ className: 'flex items-center gap-3 mb-2' },
		span({ className: 'w-20 text-sm' }, strong({}, titleCase(statName.replace('-', ' ')))),
		div({ className: 'flex-1 bg-gray-700 rounded h-5 overflow-hidden' },
			div({
				className: `${getStatColor(value)} h-full transition-all`,
				style: { width: `${percentage}%` }
			})
		),
		span({ className: 'w-8 text-right text-sm' }, value.toString())
	);
};

const EvolutionChain = async (pokemonData, api, onEvolutionClick) => {
	try {
		const species = await api.getPokemonSpecies(pokemonData.id);
		const evolutionChainData = await api.getEvolutionChain(api.getEvolutionChainId(species));

		const extractEvolutions = (chain, evolutions = []) => {
			evolutions.push({
				name: chain.species.name,
				id: parseInt(chain.species.url.split('/').filter(Boolean).pop(), 10)
			});
			if (chain.evolves_to.length > 0) {
				chain.evolves_to.forEach(evolution => extractEvolutions(evolution, evolutions));
			}
			return evolutions;
		};

		const evolutions = extractEvolutions(evolutionChainData.chain);

		return div({ className: 'mt-4' },
			p({ className: 'text-xs text-gray-400 mb-2' }, 'Evolution Chain'),
			div({ className: 'flex gap-2 flex-wrap' },
				...evolutions.map(evo => {
					const isCurrentPokemon = evo.id === pokemonData.id;
					return div({
						className: `flex flex-col items-center gap-1 p-2 rounded ${isCurrentPokemon ? 'bg-blue-900/50 border border-blue-500' : 'hover:bg-gray-800/50'} cursor-pointer transition-all`,
						onClick: () => onEvolutionClick(evo.id),
						title: titleCase(evo.name)
					},
						img({
							src: api.getPokemonImageUrl(evo.id),
							alt: titleCase(evo.name),
							className: 'w-16 h-16'
						}),
						span({ className: 'text-xs text-center' }, titleCase(evo.name))
					);
				})
			)
		);
	} catch (error) {
		console.error('Error loading evolution chain:', error);
		return div();
	}
};

const MovesSection = (moves) => {
	const MOVES_PER_PAGE = 8;
	let currentPage = 0;
	
	const movesContainer = div();
	
	const renderMoves = () => {
		const totalPages = Math.ceil(moves.length / MOVES_PER_PAGE);
		const start = currentPage * MOVES_PER_PAGE;
		const end = start + MOVES_PER_PAGE;
		const currentMoves = moves.slice(start, end);
		
		const pagination = div({ className: 'flex items-center justify-between text-xs text-gray-400 mb-3' },
			button({
				className: 'p-1 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
				onClick: () => {
					if (currentPage > 0) {
						currentPage--;
						renderMoves();
					}
				},
				disabled: currentPage === 0
			}, icon(ChevronLeft, { className: 'w-4 h-4' })),
			span({}, `Page ${currentPage + 1} of ${totalPages}`),
			button({
				className: 'p-1 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
				onClick: () => {
					if (currentPage < totalPages - 1) {
						currentPage++;
						renderMoves();
					}
				},
				disabled: currentPage === totalPages - 1
			}, icon(ChevronRight, { className: 'w-4 h-4' }))
		);
		
		const movesList = div({ className: 'space-y-1' },
			...currentMoves.map(move =>
				p({ className: 'text-sm' },
					strong({}, capitalize(move.move.name.replace('-', ' ')))
				)
			)
		);

		render(movesContainer, pagination, movesList);
	};
	
	renderMoves();
	return movesContainer;
};

const PokemonDetailedView = async (parent, pokemonId, api) => {
	const renderView = async (pId) => {
		const pokemonData = await api.getPokemon(pId);

		const statsSection = div({ className: 'mb-6' },
			h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Base Stats'),
			...pokemonData.stats.map(stat => StatBar(stat.stat.name, stat.base_stat))
		);

		const abilitiesSection = div({ className: 'mb-6' },
			h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Abilities'),
			...pokemonData.abilities.map(ability =>
				p({ className: 'text-sm mb-1' },
					strong({}, capitalize(ability.ability.name.replace('-', ' '))),
					span({ className: 'text-gray-500 ml-2' }, ability.is_hidden ? '(Hidden)' : '')
				)
			)
		);

		const typeSection = div({ className: 'mb-6' },
			h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Types'),
			div({ className: 'flex gap-2 flex-wrap' },
				...pokemonData.types.map(type =>
					span({ className: 'bg-gray-700 px-2 py-1 rounded text-xs' }, capitalize(type.type.name))
				)
			)
		);

		const infoSection = div({ className: 'mb-6' },
			h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Information'),
			p({ className: 'text-sm mb-1' },
				strong({}, 'Height: '),
				span({}, `${(pokemonData.height / 10).toFixed(1)} m`)
			),
			p({ className: 'text-sm mb-1' },
				strong({}, 'Weight: '),
				span({}, `${(pokemonData.weight / 10).toFixed(1)} kg`)
			),
			p({ className: 'text-sm' },
				strong({}, 'Base XP: '),
				span({}, pokemonData.base_experience.toString())
			)
		);

		const movesSection = div({ className: 'mb-6' },
			h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Moves'),
			MovesSection(pokemonData.moves)
		);

		const evolutionChainContent = await EvolutionChain(pokemonData, api, (newPokemonId) => {
			renderView(newPokemonId);
		});

		const leftPanel = div({ className: 'flex flex-col gap-4' },
			img({
				src: api.getPokemonImageUrl(pokemonData.id),
				alt: titleCase(pokemonData.name),
				className: 'w-64 h-64 rounded-lg'
			}),
			evolutionChainContent
		);

		const rightPanel = div({ className: 'overflow-y-auto pr-2' },
			statsSection,
			abilitiesSection,
			typeSection,
			infoSection,
			movesSection
		);

		const content = div({ className: 'flex flex-col gap-4 max-h-[80vh] min-w-[60vw]' },
			h2({ className: 'text-2xl font-bold mb-4 flex-shrink-0' }, titleCase(pokemonData.name)),
			div({ className: 'grid grid-cols-2 gap-6 flex-1 min-h-0' },
				leftPanel,
				rightPanel
			)
		);

		render(parent, content);
		return parent;
	};

	return await renderView(pokemonId);
};

export default PokemonDetailedView;