import { button, div, h1 } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { render } from "@ui/rendering.js";
import { X } from "lucide";

const MustLoginDialog = (parent, handleClose) => {
	render(parent,
		h1({ className: 'text-2xl font-bold text-white mb-2' }, 'Error'),
		div({}, 'You must be logged in to access this feature. Please log in to continue.'),
		div({ className: 'flex justify-end mt-6' },
			button({
				className: 'px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 cursor-pointer flex items-center justify-center gap-1',
				onClick: () => handleClose('cancel')
			}, icon(X, { className: 'w-5 h-5' }), 'Close')
		)
	);
}

export default MustLoginDialog;