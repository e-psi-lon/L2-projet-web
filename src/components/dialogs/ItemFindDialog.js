import { button, div, h2, p, span } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import { icon } from "@ui/icons.js";
import { showToast } from "@utils/ui/toast.js";
import Item from "@data/Item.js";
import { FINDABLE_ITEM_CATEGORIES, ITEM_CATEGORIES } from "@utils/constants.js";
import { formatTime } from "@utils/strings.js";
import { Gift } from 'lucide';

const ITEM_FIND_COOLDOWN = 3_600_000;

const getStorageKeyForAccount = (accountId) => `lastItemFindTime-${accountId}`;

export const getItemFindCooldownRemaining = (accountId) => {
	const storageKey = getStorageKeyForAccount(accountId);
	const lastTime = localStorage.getItem(storageKey);
	if (!lastTime) return 0;
	
	const elapsed = Date.now() - parseInt(lastTime, 10);
	const remaining = Math.max(0, ITEM_FIND_COOLDOWN - elapsed);
	return remaining;
};

export default async function ItemFindDialog(container, handleClose, { api, appState } = {}) {
	const accountId = appState.getCurrentAccount();
	const remaining = getItemFindCooldownRemaining(accountId);
	
	if (remaining > 0) {
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-white' }, 'Item Search'),
				p({ className: 'text-gray-400 text-center' }, 'You need to wait before searching again'),
				p({ className: 'text-lg font-semibold text-orange-500' }, `Available in ${formatTime(remaining)}`)
			)
		);
		setTimeout(() => {
			handleClose('cooldown-expired');
		}, remaining);
		return;
	}
	
	try {
		const randomCategory = FINDABLE_ITEM_CATEGORIES[Math.floor(Math.random() * FINDABLE_ITEM_CATEGORIES.length)];
		const inventory = appState.getInventory();
		
		let itemId;
		
		if (randomCategory === 'berries') {
			const berryCount = await api.getBerryCount();
			const randomBerryId = Math.floor(Math.random() * berryCount) + 1;
			const berryData = await api.getBerry(randomBerryId);
			itemId = api.getItemId(berryData.item);
		} else {
			const categoryConfig = ITEM_CATEGORIES[randomCategory];
			const itemsInCategory = await api.getItemsByCategory(categoryConfig.apiName);
			
			if (!itemsInCategory || itemsInCategory.length === 0)
				throw new Error(`No items found in category: ${randomCategory}`);
			
			const randomItemData = itemsInCategory[Math.floor(Math.random() * itemsInCategory.length)];
			itemId = api.getItemId(randomItemData);
		}
		const itemData = await api.getItem(itemId);
		const item = Item.fromAPIData(itemData);
		
		let selected = false;
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-white text-center' }, 'You Found an Item!'),
				icon(Gift, { className: 'w-16 h-16 text-amber-500' }),
				p({ className: 'text-lg font-semibold text-white' }, item.name),
				p({ className: 'text-sm text-gray-400' }, item.effect || 'A useful item'),
				div({ className: 'flex gap-3 w-full' },
					button({
						className: 'flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors',
						onClick: async () => {
							if (selected) return;
							selected = true;
							await inventory.addItemFromAPI(itemId, 1);
							const storageKey = getStorageKeyForAccount(accountId);
							localStorage.setItem(storageKey, Date.now().toString());
							showToast({
								text: `Found ${item.name}!`,
								color: 'bg-green-600',
								duration: 2500,
								position: 'top-center'
							});
							
							handleClose('found');
						}
					}, 'Take'),
					button({
						className: 'flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors',
						onClick: () => {
							handleClose('left');
						}
					}, 'Leave')
				)
			)
		);
	} catch (error) {
		console.error('Error in item find:', error);
		render(container,
			div({ className: 'flex flex-col items-center gap-4' },
				h2({ className: 'text-xl font-bold text-red-500' }, 'Error'),
				p({ className: 'text-gray-400 text-center' }, 'Failed to find item'),
				button({
					className: 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors',
					onClick: () => handleClose('error')
				}, 'Close')
			)
		);
	}
}
