export const CARD_CLASSES = 'border border-white/20 rounded-lg bg-white/5 cursor-pointer origin-center transition-transform duration-200'

export const ICE_SERVERS = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun2.l.google.com:19302' },
	{ urls: 'stun:stun.services.mozilla.com:3478' },
]

export const ITEM_CATEGORIES = {
	healing: {
		name: 'Healing',
		apiName: 'healing'
	},
	'standard-balls': {
		name: 'Standard Balls',
		apiName: 'standard-balls'
	},
	'special-balls': {
		name: 'Special Balls',
		apiName: 'special-balls'
	},
	vitamins: {
		name: 'Vitamins',
		apiName: 'vitamins'
	},
	'pp-recovery': {
		name: 'PP Recovery',
		apiName: 'pp-recovery'
	},
	'status-cures': {
		name: 'Status Cures',
		apiName: 'status-cures'
	}
}

export const FINDABLE_ITEM_CATEGORIES = [
	'healing',
	'standard-balls',
	'special-balls',
	'vitamins',
	'pp-recovery',
	'status-cures',
	'berries'
]

export const INVENTORY_TABS = [
	{ id: 'collection', label: 'Collection' },
	{ id: 'pokeballs', label: 'Pokéballs', categories: ['standard-balls', 'special-balls'] },
	{ id: 'potions', label: 'Potions', categories: ['healing', 'status-cures', 'pp-recovery'] },
	{ id: 'berries', label: 'Berries', categories: ['berries'] },
	{ id: 'keyitems', label: 'Key Items', categories: ['other'] }
]