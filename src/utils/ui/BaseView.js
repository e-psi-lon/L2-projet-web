export default class BaseView {
	static #currentViewInstance = null;

	static async switchView(ViewClass, appContainer, appState, pushHistory = true, ...args) {
		if (this.#currentViewInstance && typeof this.#currentViewInstance.destroy === 'function')
			this.#currentViewInstance.destroy();

		this.#currentViewInstance = new ViewClass(appContainer, appState, ...args);
		appState.setCurrentView(this.#currentViewInstance);

		if (pushHistory)
			window.history.pushState({ view: ViewClass.name, args }, '');

		if (typeof this.#currentViewInstance.render === 'function')
			await this.#currentViewInstance.render();

		return this.#currentViewInstance;
	}

	static getCurrentView() {
		return this.#currentViewInstance;
	}

	constructor(app) {
		if (!app)
			throw new Error('BaseView requires an app container element');
		this.app = app;
	}

	render() {
		throw new Error('render() method must be implemented by subclass');
	}


	destroy() {
	}
}

