import { render } from "@ui/rendering.js";
import { button, div, h2, img, p, span, textarea } from "@ui/dom.js";
import { icon } from "@ui/icons.js";
import { compressRTC, decompressRTC } from "@utils/compression.js";
import { Check, Copy, Loader2, X, AlertCircle } from "lucide";
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

const renderMainContent = async (parent, handleClose, { isAnswer, data, qrCodeContent, answerInputContainer, timerBarContainer, generatedAnswer }) => {
	render(parent,
		div({ className: 'flex flex-col gap-4' },
			h2({ className: 'text-lg font-bold' }, 'WebRTC Connection'),
			p({ className: 'text-sm text-gray-300' }, isAnswer
				? "Share this answer with the other player to establish the connection"
				: "Share this offer with the other player and wait for their answer"
			),
			data ? div({ className: 'flex justify-center bg-white p-4 rounded' },
				img({
						className: 'w-64 h-64 object-contain',
						src: qrCodeContent ? await QRCode.toDataURL(qrCodeContent, {
							errorCorrectionLevel: 'L',
							type: 'image/png',
							margin: 2,
							width: 400,
						}) : ''
					}
				)
			) : null,
			data ? div({ className: 'flex flex-col gap-2' },
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
		) : null,
		div({ className: 'flex flex-col gap-2' },
			p({ className: 'text-xs text-gray-400' }, isAnswer ? (generatedAnswer ? 'Generated Answer' : 'Incoming Offer') : (generatedAnswer ? 'Received Answer' : 'Waiting for Answer')),
			answerInputContainer
		),
			timerBarContainer,
			button({
					className: 'w-full bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 transition-colors flex items-center justify-center gap-2',
					onClick: handleClose
				},
				icon(X, { className: 'w-4 h-4' }),
				'Cancel'
			)
		)
	);
};

const renderAnswerSection = (answerInputContainer, { isAnswer, generatedAnswer, answerError, handleOfferInput, handleAnswerInput }) => {
	if (generatedAnswer) render(answerInputContainer,
		div({ className: 'flex flex-col gap-2' },
			p({ className: 'text-xs text-green-400' }, isAnswer ? '✓ Answer generated successfully' : '✓ Answer accepted - connection established'),
			div(
				{ className: 'flex items-center gap-2' },
				textarea({
					type: 'text',
					value: generatedAnswer,
					readOnly: true,
					onClick: (e) => e.target.select(),
					className: 'flex-1 bg-gray-800 border border-green-600 rounded px-3 py-2 text-sm text-white min-h-[80px]'
				}),
				button({
					className: 'bg-blue-600 hover:bg-blue-700 text-white rounded p-2 transition-colors',
					onClick: async () => {
						await navigator.clipboard.writeText(generatedAnswer);
					},
					title: isAnswer ? 'Copy answer to clipboard' : 'Copy for verification'
				}, icon(Copy, { className: 'w-6 h-6' }))
			),
			p({ className: 'text-xs text-gray-400' }, isAnswer ? 'Share this answer with the other player' : 'Waiting for battle to start...')
		)
	);
	else if (answerError) render(answerInputContainer,
		div({ className: 'flex flex-col gap-2' },
			div({ className: 'flex items-start gap-2 bg-red-900 border border-red-600 rounded px-3 py-2' },
				icon(AlertCircle, { className: 'w-5 h-5 text-red-400 flex-shrink-0 mt-0.5' }),
				p({ className: 'text-sm text-red-300' }, answerError)
			),
			div({ className: 'flex items-center gap-2' },
				textarea({
					id: isAnswer ? 'offerInput' : 'answerInput',
					placeholder: isAnswer ? 'Paste the offer from the other player here...' : 'Paste the answer from the other player here...',
					className: 'flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white min-h-[100px]'
				}),
				button({
					className: 'bg-green-600 hover:bg-green-700 text-white rounded p-2 transition-colors',
					onClick: async () => await (isAnswer ? handleOfferInput : handleAnswerInput)(),
					title: isAnswer ? 'Process offer and generate answer' : 'Process answer and complete connection'
				}, icon(Check, { className: 'w-6 h-6' }))
			)
		)
	);
	else render(answerInputContainer,
		div({ className: 'flex items-center gap-2' },
			textarea({
				id: isAnswer ? 'offerInput' : 'answerInput',
				placeholder: isAnswer ? 'Paste the offer from the other player here...' : 'Paste the answer from the other player here...',
				className: 'flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white min-h-[100px]'
			}),
			button({
				className: 'bg-green-600 hover:bg-green-700 text-white rounded p-2 transition-colors',
				onClick: async () => await (isAnswer ? handleOfferInput : handleAnswerInput)(),
				title: isAnswer ? 'Process offer and generate answer' : 'Process answer and complete connection'
			}, icon(Check, { className: 'w-6 h-6' }))
		)
	);
};

const handleAnswerInput = async (parent, rtcManager, onStateUpdate, reRender, onConnectionReady) => {
	const answerInput = parent.querySelector('#answerInput');
	const answerString = answerInput?.value?.trim();
	if (!answerString) {
		onStateUpdate({ answerError: 'Please paste an answer' });
		return;
	}
	try {
		if (!rtcManager) {
			onStateUpdate({ answerError: 'RTC Manager not available' });
			return;
		}

		let decompressed;
		try {
			decompressed = decompressRTC(answerString);
		} catch {
			decompressed = answerString;
		}

		await rtcManager.acceptAnswer(decompressed);
		onStateUpdate({ generatedAnswer: answerString, answerError: null });
		if (onConnectionReady) rtcManager.onConnectionOpen(onConnectionReady);

		await reRender();
	} catch (err) {
		console.error('Error processing answer:', err);
		onStateUpdate({ answerError: `Invalid answer: ${err.message}` });
		await reRender();
	}
};

const handleOfferInput = async (parent, handleClose, rtcManager, onStateUpdate, reRender, onConnectionReady) => {
	const offerInput = parent.querySelector('#offerInput');
	const offerString = offerInput?.value?.trim();
	if (!offerString) {
		onStateUpdate({ answerError: 'Please paste an offer' });
		return;
	}
	try {
		if (!rtcManager) {
			onStateUpdate({ answerError: 'RTC Manager not available' });
			return;
		}
		renderLoading(parent, handleClose, true);

		const decompressed = decompressRTC(offerString);

		const answerJson = await rtcManager.acceptOffer(decompressed);
		const generatedAnswer = compressRTC(answerJson);
		onStateUpdate({ generatedAnswer, answerError: null });
		if (onConnectionReady) rtcManager.onConnectionOpen(onConnectionReady);
		await reRender();
	} catch (err) {
		console.error('Error processing offer:', err);
		onStateUpdate({ answerError: `Invalid offer: ${err.message}` });
		await reRender();
	}
};

const onConnectionReady = (rtcManager, handleClose, timerInterval = null) => {
	console.debug('Connection established! Data channel is open');

	if (timerInterval) clearInterval(timerInterval);
	handleClose('success');
};

const ShowRtcInfoDialog = async (parent, handleClose, { isAnswer, infoPromise, rtcManager }) => {
	infoPromise = infoPromise ?? null;
	rtcManager = rtcManager ?? null;
	const COUNTDOWN_SECONDS = 60;
	let infos = null;
	let remainingSeconds = COUNTDOWN_SECONDS;
	let timerInterval = null;
	let generatedAnswer = null;
	let answerError = null;
	if (infoPromise) {
		renderLoading(parent, handleClose, isAnswer);
		infos = await infoPromise;
	}
	const data = infos ? compressRTC(infos) : null;
	const qrCodeContent = data ? `${window.location.origin}?offer=${encodeURIComponent(btoa(data))}` : null;
	const timerBarContainer = div({ className: 'flex flex-col gap-1' });
	const answerInputContainer = div({});
	const renderUI = async () => {
		await renderMainContent(parent, handleClose, { isAnswer, data, qrCodeContent, answerInputContainer, timerBarContainer, handleOfferInput: onOfferInput, generatedAnswer });
		renderAnswerSection(answerInputContainer, { isAnswer, generatedAnswer, answerError, handleOfferInput: onOfferInput, handleAnswerInput: onAnswerInput });
	};

	const updateState = (updates) => {
		if ('answerError' in updates) {
			answerError = updates.answerError;
			console.warn('Got an error:', answerError); // Non critical error
		}
		if ('generatedAnswer' in updates) {
			generatedAnswer = updates.generatedAnswer;
		}
	};

	const onOfferInput = async () => await handleOfferInput(parent, handleClose, rtcManager, updateState, renderUI, () => onConnectionReady(rtcManager, handleClose, timerInterval));
	const onAnswerInput = async () => await handleAnswerInput(parent, rtcManager, updateState, renderUI, () => onConnectionReady(rtcManager, handleClose, timerInterval));

	await renderUI();
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