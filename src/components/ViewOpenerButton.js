import { button } from '@ui/dom.js';
import { render } from '@ui/rendering.js';
import BaseView from '@ui/BaseView.js';

const ViewOpenerButton = (parent, { label, ViewClass, appContainer, appState, api, pushHistory, className }, ...args) => {
	pushHistory = pushHistory ?? true;
	className = className ?? '';
	const handleViewOpen = async () => {
		await BaseView.switchView(ViewClass, appContainer, appState, api, pushHistory, ...args);
	};

	render(parent, button({
		onClick: handleViewOpen,
		className
	}, label));

	return parent;
};

export default ViewOpenerButton;

