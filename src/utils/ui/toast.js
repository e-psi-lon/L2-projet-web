import { div } from "./dom.js";
import { render, resolveParent } from "./rendering.js";

const containers = {};

function getPositionClass(position, isAbsolute = false) {
    const positionType = isAbsolute ? 'absolute' : 'fixed';
    switch (position) {
        case 'top-right': return `${positionType} top-4 right-4`;
        case 'top-left': return `${positionType} top-4 left-4`;
        case 'bottom-right': return `${positionType} bottom-4 right-4`;
        case 'bottom-left': return `${positionType} bottom-4 left-4`;
        case 'top-center': return `${positionType} top-4 left-1/2 transform -translate-x-1/2`;
        case 'bottom-center': return `${positionType} bottom-4 left-1/2 transform -translate-x-1/2`;
        default: return `${positionType} top-4 right-4`;
    }
}

export function showToast({ text, color, duration, position, parent } = {}) {
    text = text ?? '';
    color = color ?? 'bg-blue-600';
    duration = duration ?? 3000;
    position = position ?? 'top-right';
    parent = parent ?? document.body;
    const actualParent = resolveParent(parent);
    const isCustomParent = parent !== document.body;
    if (isCustomParent && getComputedStyle(actualParent).position === 'static')
        actualParent.style.position = 'relative';
    const containerKey = `${position}-${isCustomParent ? actualParent.id || 'custom' : 'root'}`;
    let container = containers[containerKey];
    if (!container || container.parentNode !== actualParent) {
        container = div({ className: getPositionClass(position, isCustomParent) });
        actualParent.appendChild(container);
        containers[containerKey] = container;
    }

    const toast = div({
        className: `${color} text-white px-4 py-2 mb-2 rounded shadow-lg transition-opacity duration-300 animate-fade-in`,
        style: 'min-width: 200px; max-width: 400px; font-weight: 500; font-size: 1rem;',
        role: 'status',
        'aria-live': 'polite',
    }, text);
    render(container, ...Array.from(container.childNodes), toast);
    setTimeout(() => {
        toast.remove();
        if (container.childNodes.length === 0) {
            container.remove();
            delete containers[containerKey];
        }
    }, duration);
}

export default showToast;
