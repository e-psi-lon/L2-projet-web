import { resolveParent } from "./reactive.js";
import { button, dialog, div, span } from "./dom.js";
import { icon } from "./icons.js";
import { X } from 'lucide'

export const displayModal = ({content, parent = null, onClose = (_) => {}}) => {
	if (parent == null) parent = document.body;
	let actualParent = resolveParent(parent);
	let dialogElement;
	const handleClose = () => {
		dialogElement.close();
		onClose(dialogElement);
		dialogElement.remove();
		document.body.style.overflow = '';
	}
	dialogElement = dialog({
			id: 'modal-dialog',
			className: 'max-w-[90vw] max-h-[90vh] m-auto rounded-lg overflow-hidden',
			onCancel: handleClose,
			onClose: handleClose,
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
			typeof content === 'string' ? span({}, content) : content
		)
	)

	actualParent.appendChild(dialogElement);
	dialogElement.showModal();
	return dialogElement;
}