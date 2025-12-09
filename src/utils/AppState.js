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
		this.inventories.set(null, null);
	}

	setApi(api) {
		this.api = api;
	}

	getApi() {
		return this.api;
	}

	#loadAccounts() {
		try {
			const data = localStorage.getItem('pokemon-accounts');
			return data ? JSON.parse(data) : [];
		} catch (error) {
			console.error('Failed to load accounts:', error);
			return [];
		}
	}

	#saveAccounts() {
		try {
			localStorage.setItem('pokemon-accounts', JSON.stringify(this.accounts));
			if (this.currentAccount)
				localStorage.setItem('pokemon-current-account', this.currentAccount);
		} catch (error) {
			console.error('Failed to save accounts:', error);
		}
	}

	setCurrentView(view) {
		this.currentView = view;
	}

	getCurrentView() {
		return this.currentView;
	}

	setCurrentAccount(account) {
		this.currentAccount = account;
		this.#saveAccounts();
		this.#notifyStateChange();
		this.#notifyAccountChange(account);
	}

	getCurrentAccount() {
		if (this.currentAccount === null && this.accounts.length > 0) {
			const savedAccount = localStorage.getItem('pokemon-current-account');
			if (savedAccount && this.accounts.some(a => a.id === savedAccount))
				this.currentAccount = savedAccount;
		}
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
		this.#notifyStateChange();
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
			this.inventories.set(this.currentAccount, new InventoryManager(this.currentAccount, this.api));
		}
		return this.inventories.get(this.currentAccount);
	}

	onAccountChange(callback) {
		this.listeners.push({ type: 'accountChange', callback });
	}

	onStateChange(callback) {
		this.listeners.push({ type: 'stateChange', callback });
	}

	#notifyAccountChange(accountId) {
		this.listeners
			.filter(l => l.type === 'accountChange')
			.forEach(l => l.callback(accountId));
	}

	#notifyStateChange() {
		this.listeners
			.filter(l => l.type === 'stateChange')
			.forEach(l => l.callback(this));
	}

	saveBattleToHistory(battleState, winner, loser) {
		try {
			const history = JSON.parse(localStorage.getItem('pokemon-battle-history') || '{}');
			history[battleState.battleId] = {
				battleId: battleState.battleId,
				timestamp: Date.now(),
				player1Id: battleState.player1.accountId,
				player2Id: battleState.player2.accountId,
				winner,
				loser,
				stateJson: JSON.stringify(battleState.toJSON())
			};
			localStorage.setItem('pokemon-battle-history', JSON.stringify(history));
		} catch (error) {
			console.error('Failed to save battle history:', error);
		}
	}

	getBattleHistory() {
		try {
			return JSON.parse(localStorage.getItem('pokemon-battle-history') || '{}');
		} catch (error) {
			console.error('Failed to load battle history:', error);
			return {};
		}
	}

	getBattleById(battleId) {
		const history = this.getBattleHistory();
		return history[battleId];
	}
}
