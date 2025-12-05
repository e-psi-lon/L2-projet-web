import { div, span, strong } from '@ui/dom.js';
import { render } from "@ui/rendering.js";
import { titleCase } from '@utils/strings.js';

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

const StatBar = (parent, { statName, value, maxValue, showLabel, showValue, labelWidth, barHeight, gap, colorThresholds } = {}) => {
	maxValue = maxValue ?? 255;
	showLabel = showLabel ?? true;
	showValue = showValue ?? true;
	labelWidth = labelWidth ?? 'w-20';
	barHeight = barHeight ?? 'h-5';
	gap = gap ?? 'gap-3';
	colorThresholds = colorThresholds ?? {};

	const percentage = (value / maxValue) * 100;

	render(parent, div({ className: `flex items-center ${gap} mb-2` },
		showLabel ? span({ className: `${labelWidth} text-sm` }, strong({}, titleCase(statName.replace('-', ' ')))) : null,
		div({ className: `flex-1 bg-gray-700 rounded ${barHeight} overflow-hidden` },
			div({
				className: `${getStatColor(value, maxValue, colorThresholds)} ${barHeight} transition-all rounded`,
				style: { width: `${percentage}%` }
			})
		),
		showValue ? span({ className: `w-8 text-right text-sm` }, value.toString()) : null
	));
	return parent;
};

export default StatBar;
export { getStatColor };

