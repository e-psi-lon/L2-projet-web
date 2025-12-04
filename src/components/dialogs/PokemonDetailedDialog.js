import StatBar from '@components/StatBar.js';
import { button, div, h2, h3, img, p, span, strong } from '@ui/dom.js';
import { icon } from '@ui/icons.js';
import { render } from '@ui/reactive.js';
import { capitalize, titleCase } from '@utils/strings.js';
import { ChevronLeft, ChevronRight } from 'lucide';

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

const renderEvolutionContent = (evolutions, pokemonData, api, onEvolutionClick) => {
	return div({ className: 'flex gap-2 flex-wrap' },
		...evolutions.map(evo => {
			const isCurrentPokemon = evo.id === pokemonData.id;
			return div({
					className: `flex flex-col items-center gap-1 p-2 rounded ${isCurrentPokemon ? 'bg-blue-900/50 border border-blue-500' : 'hover:bg-gray-800/50'} cursor-pointer transition-all`,
					onClick: () => onEvolutionClick(evo.id),
					title: titleCase(evo.name)
				},
				img({
					src: api.getPokemonImageUrl(evo.id),
					alt: `Image of ${capitalize(evo.name)} #${evo.id}`,
					loading: 'lazy',
					className: 'w-12 h-12'
				}),
				span({ className: 'text-xs text-center' }, titleCase(evo.name))
			);
		})
	);
};

const renderVarietiesContent = (specialVarieties, api, onEvolutionClick) => {
	return div({ className: 'flex gap-2 flex-wrap' },
		...specialVarieties.map(variety => {
			const varietyPokemonId = api.getPokemonId(variety.pokemon);
			const varietyLabel = titleCase(variety.pokemon.name);

			return div({
					className: 'flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-800/50 cursor-pointer transition-all',
					onClick: () => onEvolutionClick(varietyPokemonId),
					title: varietyLabel
				},
				img({
					src: api.getPokemonImageUrl(varietyPokemonId),
					alt: varietyLabel,
					loading: 'lazy',
					className: 'w-12 h-12'
				}),
				span({ className: 'text-xs text-center' }, varietyLabel)
			);
		})
	);
};

const updateEvolutionChain = (container, showEvolutionChain, evolutions, specialVarieties, pokemonData, api, onEvolutionClick) => {
	const content = showEvolutionChain ?
		renderEvolutionContent(evolutions, pokemonData, api, onEvolutionClick)
		:
		renderVarietiesContent(specialVarieties, api, onEvolutionClick);

	const toggleButtonsArray = [
		button({
			className: `px-3 py-1 text-xs rounded transition-all ${showEvolutionChain ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`,
			onClick: () => {
				updateEvolutionChain(container, true, evolutions, specialVarieties, pokemonData, api, onEvolutionClick);
			}
		}, 'Evolution Chain')
	];

	if (specialVarieties.length > 0) {
		toggleButtonsArray.push(
			button({
				className: `px-3 py-1 text-xs rounded transition-all ${!showEvolutionChain ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`,
				onClick: () => {
					updateEvolutionChain(container, false, evolutions, specialVarieties, pokemonData, api, onEvolutionClick);
				}
			}, 'Varieties')
		);
	}

	const toggleButtons = div({ className: 'flex gap-2 mb-2' }, ...toggleButtonsArray);

	render(container, toggleButtons, content);
};

const updateMoves = (container, moves, currentPage) => {
	const MOVES_PER_PAGE = 8;
	const totalPages = Math.ceil(moves.length / MOVES_PER_PAGE);
	const start = currentPage * MOVES_PER_PAGE;
	const end = start + MOVES_PER_PAGE;
	const currentMoves = moves.slice(start, end);

	const pagination = div({ className: 'flex items-center justify-between text-xs text-gray-400 mb-3' },
		button({
			className: 'p-1 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
			onClick: () => {
				if (currentPage > 0) {
					updateMoves(container, moves, currentPage - 1);
				}
			},
			disabled: currentPage === 0
		}, icon(ChevronLeft, { className: 'w-4 h-4 hover:bg-gray-700 rounded-full' })),
		span({}, `Page ${currentPage + 1} of ${totalPages}`),
		button({
			className: 'p-1 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
			onClick: () => {
				if (currentPage < totalPages - 1) {
					updateMoves(container, moves, currentPage + 1);
				}
			},
			disabled: currentPage === totalPages - 1
		}, icon(ChevronRight, { className: 'w-4 h-4 hover:bg-gray-700 rounded-full' }))
	);

	const movesList = div({ className: 'space-y-1' },
		...currentMoves.map(move =>
			p({ className: 'text-sm' },
				strong({}, capitalize(move.move.name.replace('-', ' ')))
			)
		)
	);

	render(container, pagination, movesList);
};

const renderDetailedView = async (parent, pokemonId, api, onEvolutionChange) => {
	const pokemonData = await api.getPokemon(pokemonId);
	let species;
	try {
		species = await api.getPokemonSpecies(api.getPokemonSpeciesId(pokemonData.species));
	} catch (error) {
		render(parent, div({ className: 'text-red-500' }, 'Error loading Pokémon data.'));
		return parent;
	}

	const statsSection = div({ className: 'mb-6' },
		h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Base Stats'),
		...pokemonData.stats.map(stat => StatBar(div(), { statName: stat.stat.name, value: stat.base_stat }))
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

	const generationId = parseInt(species.generation.url.split('/').filter(Boolean).pop(), 10);

	const typeSection = div({ className: 'mb-6' },
		h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Types'),
		div({ className: 'flex gap-4 flex-wrap' },
			...await Promise.all(pokemonData.types.map(async (type) => {
				const spriteUrl = await api.getTypeSprite(type.type.name, generationId);

				if (spriteUrl) {
					return div({ className: 'flex flex-col items-center gap-1' },
						img({
							src: spriteUrl,
							alt: capitalize(type.type.name),
							className: 'w-20 h-8 cursor-help',
							loading: 'lazy',
							title: capitalize(type.type.name)
						}),
						span({ className: 'text-xs' }, capitalize(type.type.name))
					);
				} else {
					return span({ className: 'bg-gray-700 px-2 py-1 rounded text-xs' }, capitalize(type.type.name));
				}
			}))
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
			span({}, (pokemonData.base_experience || "N/A").toString())
		)
	);

	const movesContainer = div({ className: 'mb-6' },
		h3({ className: 'text-sm font-bold text-gray-300 mb-3' }, 'Moves'),
		div()
	);
	updateMoves(movesContainer.children[1], pokemonData.moves, 0);

	const evolutionChainData = await api.getEvolutionChain(api.getEvolutionChainId(species.evolution_chain));
	const evolutions = extractEvolutions(evolutionChainData.chain);
	const specialVarieties = species.varieties ? species.varieties.filter(v => !v.is_default) : [];

	const evolutionContainer = div({ className: 'mt-4' },
		div()
	);
	updateEvolutionChain(evolutionContainer.children[0], true, evolutions, specialVarieties, pokemonData, api, (newPokemonId) => {
		onEvolutionChange(newPokemonId);
	});

	const leftPanel = div({ className: 'flex flex-col gap-4' },
		img({
			src: api.getPokemonImageUrl(pokemonData.id),
			alt: `Image of ${titleCase(pokemonData.name)} #${pokemonData.id}`,
			loading: 'lazy',
			className: 'w-48 h-48 rounded-lg'
		}),
		evolutionContainer
	);

	const rightPanel = div({ className: 'overflow-y-auto pr-2' },
		statsSection,
		abilitiesSection,
		typeSection,
		infoSection,
		movesContainer
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

const PokemonDetailedDialog = async (parent, _, { pokemonId, api }) => {
	const onEvolutionChange = (newPokemonId) => {
		renderDetailedView(parent, newPokemonId, api, onEvolutionChange);
	};

	return await renderDetailedView(parent, pokemonId, api, onEvolutionChange);
};

export default PokemonDetailedDialog;