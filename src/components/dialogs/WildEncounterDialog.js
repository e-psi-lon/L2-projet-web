import { button, div, h2, img, p, span } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import Pokemon from "@data/Pokemon.js";
import { showToast } from "@utils/ui/toast.js";

const WILD_ENCOUNTER_COOLDOWN = 3_600_000;

const getStorageKeyForAccount = (accountId) => `lastWildEncounterTime-${accountId}`;

export const getWildEncounterCooldownRemaining = (accountId) => {
	const storageKey = getStorageKeyForAccount(accountId);
	const lastTime = localStorage.getItem(storageKey);
	if (!lastTime) return 0;
	
	const elapsed = Date.now() - parseInt(lastTime, 10);
	const remaining = Math.max(0, WILD_ENCOUNTER_COOLDOWN - elapsed);
	return remaining;
};

const formatTime = (ms) => {
	const seconds = Math.ceil(ms / 1000);
	return `${seconds}s`;
};

export default async function WildEncounterDialog(container, handleClose, { api, appState } = {}) {
	const accountId = appState.getCurrentAccount();
	const remaining = getWildEncounterCooldownRemaining(accountId);
	if (remaining > 0) {
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-white' }, 'Wild Encounter'),
				p({ className: 'text-gray-400 text-center' }, 'You need to wait before finding another Pokémon'),
				p({ className: 'text-lg font-semibold text-orange-500' }, `Available in ${formatTime(remaining)}`)
			)
		);
		setTimeout(() => {
			handleClose('cooldown-expired');
		}, remaining);
		
		return;
	}
	
	try {
		const randomId = Math.floor(Math.random() * await api.getPokemonSpeciesCount()) + 1;
		const pokemonData = await api.getPokemon(randomId);
		const pokemon = new Pokemon(pokemonData);
		let selected = false;
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-white text-center' }, 'Wild Pokémon Encountered!'),
				img({
					src: api.getPokemonImageUrl(pokemon.id),
					alt: pokemon.name,
					className: 'w-32 h-32'
				}),
				p({ className: 'text-lg font-semibold text-white' }, pokemon.name),
				div({ className: 'flex gap-3 w-full' },
					button({
						className: 'flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors',
						onClick: async () => {
							if (selected) return;
							selected = true;
							const inventory = appState.getInventory();
							inventory.addPokemon(pokemon);
							const storageKey = getStorageKeyForAccount(accountId);
							localStorage.setItem(storageKey, Date.now().toString());
							
							showToast({
								text: `Caught ${pokemon.name}!`,
								color: 'bg-green-600',
								duration: 2500,
								position: 'top-center'
							});
							
							handleClose('caught');
						}
					}, 'Catch'),
					button({
						className: 'flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors',
						onClick: () => {
							handleClose('escaped');
						}
					}, 'Let Go')
				)
			)
		);
	} catch (error) {
		console.error('Error loading wild Pokémon:', error);
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-red-500' }, 'Error'),
				p({ className: 'text-gray-400 text-center' }, 'Failed to load wild Pokémon'),
				button({
					className: 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors',
					onClick: () => handleClose('error')
				}, 'Close')
			)
		);
	}
}
