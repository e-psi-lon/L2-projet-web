export function el(tag, props = {}, ...children) {
	const element = document.createElement(tag)

	Object.entries(props).forEach(([key, value]) => {
		if (key === 'className' && typeof value === 'string')
			element.className = value
		else if (key === 'className' && Array.isArray(value))
			element.className = value.filter(Boolean).join(' ')
		else if (key === 'style' && typeof value === 'object')
			Object.assign(element.style, value)
		else if (key.startsWith('on') && typeof value === 'function') {
			const eventName = key.slice(2).toLowerCase()
			element.addEventListener(eventName, value)
		} else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'value' || key === 'hidden')
			element[key] = value
		else if (value != null)
			element.setAttribute(key, value.toString())
	})

	children.flat().forEach(child => {
		if (child != null)
			if (typeof child === 'string' || typeof child === 'number')
				element.appendChild(document.createTextNode(child.toString()))
			else
				element.appendChild(child)
	})
	return element
}

export const div = (props = {}, ...children) => el('div', props, ...children)
export const span = (props = {}, ...children) => el('span', props, ...children)
export const br = (props = {}) => el('br', props)
export const p = (props = {}, ...children) => el('p', props, ...children)
export const h1 = (props = {}, ...children) => el('h1', props, ...children)
export const h2 = (props = {}, ...children) => el('h2', props, ...children)
export const h3 = (props = {}, ...children) => el('h3', props, ...children)
export const h4 = (props = {}, ...children) => el('h4', props, ...children)
export const h5 = (props = {}, ...children) => el('h5', props, ...children)
export const h6 = (props = {}, ...children) => el('h6', props, ...children)
export const a = (props = {}, ...children) => el('a', props, ...children)
export const button = (props = {}, ...children) => el('button', props, ...children)
export const img = (props = {}, ...children) => el('img', props, ...children)
export const label = (props = {}, ...children) => el('label', props, ...children)
export const input = (props = {}, ...children) => el('input', props, ...children)
export const textarea = (props = {}, ...children) => el('textarea', props, ...children)
export const form = (props = {}, ...children) => el('form', props, ...children)
export const ul = (props = {}, ...children) => el('ul', props, ...children)
export const ol = (props = {}, ...children) => el('ol', props, ...children)
export const li = (props = {}, ...children) => el('li', props, ...children)
export const nav = (props = {}, ...children) => el('nav', props, ...children)
export const header = (props = {}, ...children) => el('header', props, ...children)
export const footer = (props = {}, ...children) => el('footer', props, ...children)
export const main = (props = {}, ...children) => el('main', props, ...children)
export const section = (props = {}, ...children) => el('section', props, ...children)
export const strong = (props = {}, ...children) => el('strong', props, ...children)
export const em = (props = {}, ...children) => el('em', props, ...children)
export const select = (props = {}, ...children) => el('select', props, ...children)
export const option = (props = {}, ...children) => el('option', props, ...children)
export const dialog = (props = {}, ...children) => el('dialog', props, ...children)