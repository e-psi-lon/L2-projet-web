import MustLoginDialog from "@dialogs/MustLoginDialog.js";
import { displayDialog } from "@ui/dialog.js";
import { button } from '@ui/dom.js';
import { render } from '@ui/rendering.js';
import BaseView from '@ui/BaseView.js';

const ViewOpenerButton = (parent, { label, ViewClass, appContainer, appState, api, requiresLogin, pushHistory, className }, ...args) => {
	pushHistory = pushHistory ?? true;
	requiresLogin = requiresLogin ?? false;
	className = className ?? '';
	const handleViewOpen = async () => {
		if (requiresLogin && appState.getCurrentAccount() === null)
			await displayDialog({
				DialogComponentOrContent: MustLoginDialog
			})
		else await BaseView.switchView(ViewClass, appContainer, appState, api, pushHistory, ...args);
	};

	render(parent, button({
		onClick: handleViewOpen,
		className
	}, label));

	return parent;
};

export default ViewOpenerButton;

