import { render } from "@ui/reactive.js";
import { button, div, h2, img, p, span, textarea } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { compressRTC } from "@utils/compression.js";
import { Check, Copy, Loader2, X } from "lucide";
import QRCode from "qrcode";
import StatBar from "@components/StatBar.js";


const renderLoading = (parent, handleClose, isAnswer) => {
	const loadingText = isAnswer
		? 'Accepting connection from other player'
		: 'Creating room\'s connection offer';
	const loadingTextSize = isAnswer ? 'min-w-[41ch]' : 'min-w-[35ch]'
	render(parent,
		div({ className: 'flex flex-col gap-4 items-center justify-center py-8' },
			h2({ className: 'text-lg font-bold' }, 'WebRTC Connection'),
			icon(Loader2, { className: 'animate-spin w-6 h-6'}),
			div({ className: `flex justify-center items-center gap-3 ${loadingTextSize}` },
				span({ className: 'animate-dots'}, loadingText)
			),
			button({
				className: 'mt-4 bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 transition-colors flex items-center justify-center gap-2',
				onClick: handleClose
			}, icon(X, { className: 'w-4 h-4' }), 'Cancel')
		)
	);
}

const ShowRtcInfoDialog = async (parent, handleClose, { isAnswer, infoPromise }) => {
	infoPromise = infoPromise ?? null;
	const COUNTDOWN_SECONDS = 60;
	let infos = null;
	let remainingSeconds = COUNTDOWN_SECONDS;
	let timerInterval = null;
	const instructionText = isAnswer
		? "Share this answer with the other player to establish the connection"
		: "Share this offer with the other player and wait for their answer";

	if (infoPromise) {
		renderLoading(parent, handleClose, isAnswer);
		infos = await infoPromise;
	}

	const data = compressRTC(infos);
	const qrCodeContent = `${window.location.origin}?offer=${encodeURIComponent(btoa(data))}`;
	const timerBarContainer = div({ className: 'flex flex-col gap-1' });


	render(parent,
		div({ className: 'flex flex-col gap-4' },
			h2({ className: 'text-lg font-bold' }, 'WebRTC Connection'),
			p({ className: 'text-sm text-gray-300' }, instructionText),
			!isAnswer ? div({ className: 'flex justify-center bg-white p-4 rounded' },
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
			) : null,
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
			!isAnswer ? div({ className: 'flex flex-col gap-2' },
				p({ className: 'text-xs text-gray-400' }, 'Answer'),
				div({ className: 'flex item-center gap-2' },
					textarea({
						type: 'text',
						placeholder: 'Paste the answer given by the other player here then click on the button next to validate it...',
						className: 'flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white'
					}),
					button({
						className: 'bg-blue-600 hover:bg-blue-700 text-white rounded p-2 transition-colors',
						onClick: () => {
							if (timerInterval) clearInterval(timerInterval);
							handleClose();
						},
						title: 'Validate answer'
					}, icon(Check, { className: 'w-6 h-6' }))
				)
			) : null,
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
			handleClose('cancel')
		}
	}, 1000);

	return parent;
}

export default ShowRtcInfoDialog