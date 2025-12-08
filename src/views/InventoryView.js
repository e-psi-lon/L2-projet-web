import BaseView from "@ui/BaseView.js";
import { div, h1 } from "@ui/dom.js";
import { render } from "@ui/rendering.js";
import ViewOpenerButton from "@components/ViewOpenerButton.js";
import MainMenuView from "@views/MainMenuView.js";

export default class InventoryView extends BaseView {
	constructor(app, appState) {
		super(app);
		this.appState = appState;
	}

	async render() {
		render(this.app,
			div({ className: 'flex flex-col flex-1' },
				div({ className: 'p-6 border-b border-gray-700' },
					h1({ className: 'text-3xl font-bold text-white' }, 'Inventory & Team')
				),
				div({ className: 'flex-1 flex items-center justify-center' },
					div({ className: 'text-gray-400 text-center' }, 'Inventory view')
				),
				div({ className: 'p-4 border-t border-gray-700' },
					ViewOpenerButton(
						div(),
						{
							label: 'Back',
							ViewClass: MainMenuView,
							appContainer: this.app,
							appState: this.appState,
							className: 'px-4 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition'
						}
					)
				)
			)
		);
	}

	destroy() {
	}
}

