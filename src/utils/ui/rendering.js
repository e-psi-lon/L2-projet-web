export const resolveParent = (parent) => {
	if (parent instanceof HTMLElement) return parent;
	return document.getElementById(parent);
}

export const render = (parent, ...nodes) => {
	parent = resolveParent(parent);
	parent.innerHTML = '';
	nodes.flat().forEach(child => {
		if (child != null)
			parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
	})
	return parent;
}