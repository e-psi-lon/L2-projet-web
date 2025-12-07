import InventoryManager from '@utils/InventoryManager.js';

export default class AppState {
	constructor() {
		this.currentView = null;
		this.api = null;
		this.currentAccount = null;
		this.accounts = this.#loadAccounts();
		this.listeners = [];
		this.battleRtc = null;
		this.inventories = new Map(); // accountId -> InventoryManager
	}

	setApi(api) {
		this.api = api;
	}

	getApi() {
		return this.api;
	}

	#loadAccounts() {
		try {
			const data = localStorage.getItem('pokemon-pvp-accounts');
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to load accounts:', error);
			return [];
		}
	}

	#saveAccounts() {
		try {
			localStorage.setItem('pokemon-pvp-accounts', JSON.stringify(this.accounts));
		} catch (error) {
			console.error('Failed to save accounts:', error);
		}
	}

	setCurrentView(view) {
		this.currentView = view;
		this.notifyListeners();
	}

	getCurrentView() {
		return this.currentView;
	}

	setCurrentAccount(account) {
		this.currentAccount = account;
		this.notifyListeners();
	}

	getCurrentAccount() {
		return this.currentAccount;
	}

	getCurrentAccountName() {
		return this.getAccountName(this.currentAccount);
	}

	getAccountName(accountId) {
		return this.accounts.find(a => a.id === accountId)?.name;
	}

	getAccounts() {
		return this.accounts;
	}

	addAccount(name) {
		const account = { id: crypto.randomUUID(), name };
		this.accounts.push(account);
		this.#saveAccounts();
		this.notifyListeners();
		return account;
	}

	getBattleRtc() {
		return this.battleRtc;
	}

	setBattleRtc(rtc) {
		this.battleRtc = rtc;
	}

	getSelectedTeam() {
		const inventory = this.getInventory();
		return inventory ? inventory.getSelectedTeam() : [];
	}

	setSelectedTeam(team) {
		const inventory = this.getInventory();
		if (inventory) {
			inventory.setSelectedTeam(team);
		}
	}

	getInventory() {
		if (!this.inventories.has(this.currentAccount)) {
			this.inventories.set(this.currentAccount, new InventoryManager(this.currentAccount));
		}
		return this.inventories.get(this.currentAccount);
	}

	subscribe(listener) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	notifyListeners() {
		this.listeners.forEach(listener => listener(this));
	}
}
