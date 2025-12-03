import { button, div, h3, input, label } from "@ui/dom.js";
import { render } from "@ui/reactive.js";

const NewAccountDialog = (parent, handleClose) => {
	render(parent,
		h3({ className: 'text-lg font-bold text-white mb-4' }, 'Create New Account'),
		label({ className: 'block mb-2 text-sm font-medium text-white' }, 'Account Name:',
			div({ className: 'mt-1' }),
			input({
					type: 'text',
					id: 'account-name',
					required: true,
					maxLength: 16,
					minLength: 3,
					pattern: "[a-zA-Z0-9_\\-]{3,16}",
					autoComplete: 'off',
					placeholder: 'Enter account name',
					className: 'w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500 mb-4',
				}
			)
		),
		div({ className: 'flex justify-end' },
			button({
				className: 'px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 cursor-pointer',
				onClick: () => {
					parent.querySelector('input').value = ''; // Reset the input value
					handleClose()
				}
			}, 'Cancel'),
			button({
				className: 'px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 cursor-pointer ml-2',
				onClick: handleClose
			}, 'Create')
		)
	)

	return parent;
}


export default NewAccountDialog;