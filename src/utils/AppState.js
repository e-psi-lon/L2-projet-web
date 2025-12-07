export default class AppState {
	constructor() {
		this.currentView = null;
		this.currentAccount = null;
		this.accounts = this.#loadAccounts();
		this.listeners = [];
		this.battleRtc = null;
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
