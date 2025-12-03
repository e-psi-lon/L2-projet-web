export default class AppState {
	constructor() {
		this.currentView = null;
		this.currentAccount = null;
		this.accounts = ['Account 1', 'Account 2', 'Account 3'];
		this.listeners = [];
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

	getAccounts() {
		return this.accounts;
	}

	addAccount(account) {
		this.accounts.push(account);
		this.notifyListeners();
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

