import { X } from 'lucide'
import { button, dialog, div, span } from "./dom.js";
import { icon } from "./icons.js";
import { render, resolveParent } from "./rendering.js";

export const displayDialog = async ({ DialogComponentOrContent, parent, onClose, }, args = null) => {
	parent = parent ?? document.body;
	onClose = onClose ?? (() => {});

	let actualParent = resolveParent(parent);
	let dialogElement;
	let isClosed = false;

	const contentDiv = div({ className: 'h-full w-full' });

	const cleanup = (reason = 'cancel') => {
		if (isClosed) return;
		isClosed = true;
		dialogElement.remove();
		document.body.style.overflow = '';
		onClose(dialogElement, reason);
	};

	const handleClose = (reason = 'close') => {
		cleanup(reason);
		dialogElement.close();
	};

	dialogElement = dialog({
			id: 'modal-dialog',
			className: 'max-w-[90vw] max-h-[90vh] m-auto rounded-lg overflow-hidden',
			onCancel: () => cleanup('cancel'),
			onClose: () => cleanup('dismiss'),
			onClick: (e) => {
				if (e.target === dialogElement) handleClose('backdrop');
			}
		},
		div({ className: 'p-4 flex flex-col gap-4 h-full' },
			div({ className: 'flex justify-end' },
				button({
					className: 'bg-transparent border-0 p-0 m-0 outline-none cursor-pointer',
					onClick: () => handleClose('x-button')
				}, icon(X, { className: 'w-5 h-5 hover:text-red-500 transition-colors duration-200' }))
			),
			contentDiv
		)
	);

	actualParent.appendChild(dialogElement);
	document.body.style.overflow = 'hidden';
	dialogElement.showModal();

	if (typeof DialogComponentOrContent === 'string')
		render(contentDiv, span({}, DialogComponentOrContent));
	else if (typeof DialogComponentOrContent === 'function') {
		const result = args ? DialogComponentOrContent(contentDiv, handleClose, args) : DialogComponentOrContent(contentDiv, handleClose);
		if (result instanceof Promise) await result;
	}

	return dialogElement;
};
