import BaseView from "@ui/BaseView.js";
import ShowRtcInfoDialog from "@dialogs/ShowRtcInfoDialog.js";
import BattleView from "@views/BattleView.js";
import MainMenuView from "@views/MainMenuView.js";
import { displayDialog } from "@ui/dialog.js";
import { render } from "@ui/rendering.js"
import { button, div, p, h1, h2 } from "@ui/dom.js";
import { Zap, Users, ArrowLeft } from "lucide";
import { icon } from "@ui/icons.js";
import ViewOpenerButton from "@components/ViewOpenerButton.js";
import { decompressRTC } from "@utils/compression.js";
import WebRTCManager from "@utils/WebRTCManager.js";

export default class LobbyView extends BaseView {
	constructor(app, appState, offer = null) {
		super(app);
		this.api = appState.getApi();
		this.appState = appState;
		this.rtc = null;
		this.stopRtc = true;
		this.offer = offer ? decompressRTC(atob(decodeURIComponent(offer))) : null;
	}

	async #offerProvided() {
		const answerPromise = (async () => {
			await this.createRtc(false);
			return await this.rtc.acceptOffer(this.offer);
		})();
		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
			onClose: async (div, reason) => {
				if (reason === 'success') {
					await this.transitionToBattle();
				} else if (reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') {
					if (answerPromise.pending) answerPromise.cancel();
					if (this.rtc) this.rtc.close();
				}
			}
		}, { infoPromise: answerPromise, isAnswer: true })
	}

	async #joinRoom() {
		await this.createRtc(false);

		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
			onClose: async (div, reason) => {
				if (reason === 'success') {
					await this.transitionToBattle();
				} else if ((reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') && this.rtc)
					this.rtc.close();
			}
		}, { isAnswer: true, rtcManager: this.rtc })
	}

	async #startRoom() {
		const offerPromise = (async () => {
			await this.createRtc(true);
			return await this.rtc.createOffer();
		})();

		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
			onClose: async (div, reason) => {
				if (reason === 'success') {
					await this.transitionToBattle();
				} else if (reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') {
					if (offerPromise.pending) offerPromise.cancel();
					if (this.rtc) this.rtc.close();
				}
			}
		}, { infoPromise: offerPromise, isAnswer: false, rtcManager: this.rtc })
	}

	async transitionToBattle() {
		this.appState.setBattleRtc(this.rtc);
		this.stopRtc = false;
		await BaseView.switchView(BattleView, this.app, this.appState, this.api, true);
	}

	async createRtc(isHost) {
		this.rtc = new WebRTCManager(isHost);
		this.rtc.onMessage((message) => {
			console.log('Received message from opponent:', message);
		})
		await this.rtc.init();
	}

	async render() {
		render(this.app,
			div({ className: 'flex flex-col h-screen' },
				div({ className: 'p-4 border-b border-gray-700' },
					ViewOpenerButton(
						div(),
						{
							label: div({ className: 'flex items-center justify-center gap-2' },
								icon(ArrowLeft, { className: 'w-4 h-4' }),
								'Back to Menu'
							),
							ViewClass: MainMenuView,
							appContainer: this.app,
							appState: this.appState,
							className: 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors'
						}
					)
				),
				div({ className: 'flex-1 p-8 overflow-auto' },
					div({ className: 'mb-12 text-center' },
						h1({ className: 'text-5xl font-bold text-white mb-2' }, 'Pokémon PvP Battle'),
						p({ className: 'text-gray-400 text-lg' }, 'Connect with another player and battle')
					),

					div({ className: 'max-w-6xl mx-auto grid md:grid-cols-2 gap-8' },
						div({ className: 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-lg p-8 backdrop-blur-sm hover:border-blue-500/60 transition-colors' },
							div({ className: 'flex items-center gap-3 mb-6' },
								icon(Zap, { className: 'w-8 h-8 text-blue-400' }),
								h2({ className: 'text-2xl font-bold text-white' }, 'Create Room')
							),
							p({ className: 'text-gray-300 mb-6 text-sm leading-relaxed' },
								'You will be the room host. Generate a unique offer code and share it with another player. They will use this code to join your battle.'
							),
							button({
								onClick: async () => await this.#startRoom(),
								className: 'w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2'
							},
								icon(Zap, { className: 'w-5 h-5' }),
								'Start Room'
							)
						),

						div({ className: 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-lg p-8 backdrop-blur-sm hover:border-purple-500/60 transition-colors' },
							div({ className: 'flex items-center gap-3 mb-6' },
								icon(Users, { className: 'w-8 h-8 text-purple-400' }),
								h2({ className: 'text-2xl font-bold text-white' }, 'Join Room')
							),
							p({ className: 'text-gray-300 mb-6 text-sm leading-relaxed' },
								'Click the button below to enter the offer code from the room host.'
							),
							button({
								onClick: async () => await this.#joinRoom(),
								className: 'w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2'
							},
								icon(Users, { className: 'w-5 h-5' }),
								'Join Room'
							)
						)
					)
				)
			)
		);
		if (this.offer) {
			await this.#offerProvided();
		}
	}

	destroy() {
		this.app.innerHTML = '';
		if (this.rtc && this.stopRtc) this.rtc.close();
	}
}