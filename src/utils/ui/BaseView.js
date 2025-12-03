export default class BaseView {
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

