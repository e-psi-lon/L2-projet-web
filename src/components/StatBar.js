import { div, span, strong } from '@ui/dom.js';
import { titleCase } from '../utils/strings.js';
import {render} from "@ui/reactive.js";

const getStatColor = (value, maxValue = 255, colorThresholds = {}) => {
	const {
		red = 20,
		orange = 35,
		yellow = 50,
		green = 70
	} = colorThresholds;

	const percentage = (value / maxValue) * 100;
	if (percentage < red) return 'bg-red-500';
	if (percentage < orange) return 'bg-orange-500';
	if (percentage < yellow) return 'bg-yellow-500';
	if (percentage < green) return 'bg-green-500';
	return 'bg-blue-500';
};

const StatBar = (parent, statName, value, options = {}) => {
	const {
		maxValue = 255,
		showLabel = true,
		showValue = true,
		labelWidth = 'w-20',
		barHeight = 'h-5',
		gap = 'gap-3',
		colorThresholds = {}
	} = options;

	const percentage = (value / maxValue) * 100;

	render(parent, div({ className: `flex items-center ${gap} mb-2` },
		showLabel && span({ className: `${labelWidth} text-sm` }, strong({}, titleCase(statName.replace('-', ' ')))),
		div({ className: `flex-1 bg-gray-700 rounded ${barHeight} overflow-hidden` },
			div({
				className: `${getStatColor(value, maxValue, colorThresholds)} ${barHeight} transition-all`,
				style: { width: `${percentage}%` }
			})
		),
		showValue && span({ className: `w-8 text-right text-sm` }, value.toString())
	));
	return parent;
};

export default StatBar;
export { getStatColor };

