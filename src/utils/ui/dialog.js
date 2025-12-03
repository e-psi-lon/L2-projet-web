import { X } from 'lucide'
import { button, dialog, div, span } from "./dom.js";
import { icon } from "./icons.js";
import { render, resolveParent } from "./reactive.js";

export const displayDialog = async ({ DialogComponentOrContent, parent, onClose, }, ...args) => {
	parent = parent ?? document.body;
	onClose = onClose ?? (() => {});

	let actualParent = resolveParent(parent);
	let dialogElement;
	let isClosed = false;

	const contentDiv = div({ className: 'h-full w-full' });

	const cleanup = () => {
		if (isClosed) return;
		isClosed = true;
		dialogElement.remove();
		document.body.style.overflow = '';
		onClose(dialogElement);
	};

	const handleClose = () => {
		cleanup();
		dialogElement.close();
	};

	dialogElement = dialog({
			id: 'modal-dialog',
			className: 'max-w-[90vw] max-h-[90vh] m-auto rounded-lg overflow-hidden',
			onCancel: cleanup,
			onClose: cleanup,
			onClick: (e) => {
				if (e.target === dialogElement) handleClose();
			}
		},
		div({ className: 'p-4 flex flex-col gap-4 h-full' },
			div({ className: 'flex justify-end' },
				button({
					className: 'bg-transparent border-0 p-0 m-0 outline-none cursor-pointer',
					onClick: handleClose
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
		const result = DialogComponentOrContent(contentDiv, handleClose, { ...args });
		if (result instanceof Promise) await result;
	}

	return dialogElement;
};
