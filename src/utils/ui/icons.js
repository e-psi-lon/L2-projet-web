import { createElement, createIcons } from 'lucide';


export const icon = (IconComponent, props = {}) => {
	const iconElement = createElement(IconComponent, {
		class: props.className ? (Array.isArray(props.className) ? props.className : [props.className]) : [],
		...Object.fromEntries(
			Object.entries(props).filter(([key]) => key !== 'className')
		)
	});

	if (props.style && typeof props.style === 'object') {
		Object.assign(iconElement.style, props.style);
	}

	return iconElement;
};

export const initIcons = (options = {}) => {
	const config = {
		nameAttr: 'data-lucide',
		...options
	};

	createIcons(config);
};
