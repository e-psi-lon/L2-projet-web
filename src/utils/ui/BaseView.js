export default class BaseView {
	static #currentViewInstance = null;
	static #nonSerializableArgs = new Map(); // Store non-serializable args separately

	static async switchView(ViewClass, appContainer, appState, api, pushHistory = true, ...args) {
		if (this.#currentViewInstance && typeof this.#currentViewInstance.destroy === 'function')
			this.#currentViewInstance.destroy();
		const serializableArgs = [];
		const nonSerializableArgs = [];

		args.forEach((arg, index) => {
			try {
				JSON.stringify(arg);
				serializableArgs.push({ index, value: arg });
			} catch {
				nonSerializableArgs.push({ index, value: arg });
			}
		});

		this.#currentViewInstance = new ViewClass(appContainer, appState, api, ...args);
		appState.setCurrentView(this.#currentViewInstance);

		if (pushHistory) {
			const viewKey = ViewClass.name;
			if (nonSerializableArgs.length > 0) {
				this.#nonSerializableArgs.set(viewKey, nonSerializableArgs);
			}
			// Store only serializable args in history
			const historyArgs = serializableArgs.map(a => a.value);
			window.history.pushState({ view: ViewClass.name, args: historyArgs }, '');
		}

		if (typeof this.#currentViewInstance.render === 'function')
			await this.#currentViewInstance.render();

		return this.#currentViewInstance;
	}

	static getCurrentView() {
		return this.#currentViewInstance;
	}

	static getNonSerializableArgs(viewName) {
		return this.#nonSerializableArgs.get(viewName) || [];
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

