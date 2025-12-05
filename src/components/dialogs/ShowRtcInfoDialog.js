import { render } from "@ui/reactive.js";
import { button, div, h2, img, p, textarea } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { compressRTC } from "@utils/compression.js";
import { Copy, X } from "lucide";
import QRCode from "qrcode";
import StatBar from "@components/StatBar.js";

const ShowRtcInfoDialog = async (parent, handleClose, { infos, isAnswer }) => {
	const COUNTDOWN_SECONDS = 60;
	let remainingSeconds = COUNTDOWN_SECONDS;
	let timerInterval = null;
	const instructionText = isAnswer
		? "Share this answer with the other player to establish the connection"
		: "Share this offer with the other player and wait for their answer";

	const data = compressRTC(infos);
	console.log(data);
	const qrCodeContent = `${window.location.origin}?offer=${encodeURIComponent(btoa(data))}`;
	console.log(qrCodeContent);
	console.log(`The content is ${qrCodeContent.length} characters long.`);
	const timerBarContainer = div({ className: 'flex flex-col gap-1' });


	render(parent,
		div({ className: 'flex flex-col gap-4' },
			h2({ className: 'text-lg font-bold' }, 'WebRTC Connection'),
			p({ className: 'text-sm text-gray-300' }, instructionText),
			div({ className: 'flex justify-center bg-white p-4 rounded' },
				img({
						className: 'w-64 h-64 object-contain',
						src: await QRCode.toDataURL(qrCodeContent, {
							errorCorrectionLevel: 'L',
							type: 'image/png',
							margin: 2,
							width: 400,
						})
					}
				)
			),
			div({ className: 'flex flex-col gap-2' },
				p({ className: 'text-xs text-gray-400' }, 'Connection Info:'),
				div(
					{ className: 'flex items-center gap-2' },
					textarea({
						type: 'text',
						value: data,
						readOnly: true,
						onClick: (e) => e.target.select(),
						className: 'flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white truncate'
					}),
					button({
						className: 'bg-blue-600 hover:bg-blue-700 text-white rounded p-2 transition-colors',
						onClick: async () => {
							await navigator.clipboard.writeText(data);
						},
						title: 'Copy to clipboard'
					}, icon(Copy, { className: 'w-6 h-6' }))
				)
			),
			timerBarContainer,
			button({
					className: 'w-full bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 transition-colors flex items-center justify-center gap-2',
					onClick: () => {
						if (timerInterval) clearInterval(timerInterval);
						handleClose();
					}
				},
				icon(X, { className: 'w-4 h-4' }),
				'Cancel'
			)
		)
	);



	const updateTimerBar = () => {
		render(timerBarContainer,
			p({ className: 'text-xs text-gray-400' }, `Time remaining: ${remainingSeconds}s`),
			StatBar(div(), {
				statName: 'connection-timer',
				value: remainingSeconds,
				maxValue: COUNTDOWN_SECONDS,
				showLabel: false,
				showValue: false,
				barHeight: 'h-2',
				colorThresholds: {
					red: 0,
					orange: 0,
					yellow: 0,
					green: 0
				}
			})
		);
	};

	updateTimerBar();
	timerInterval = setInterval(() => {
		remainingSeconds--;
		updateTimerBar();

		if (remainingSeconds <= 0) {
			clearInterval(timerInterval);
			handleClose();
		}
	}, 1000);

	return parent;
}

export default ShowRtcInfoDialog