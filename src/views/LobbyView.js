import BaseView from "@ui/BaseView.js";
import ShowRtcInfoDialog from "@dialogs/ShowRtcInfoDialog.js";
import BattleView from "@views/BattleView.js";
import { displayDialog } from "@ui/dialog.js";
import { render } from "@ui/rendering.js"
import { button, div, p } from "@ui/dom.js";
import { decompressRTC } from "@utils/compression.js";
import WebRTCManager from "@utils/WebRTCManager.js";

export default class LobbyView extends BaseView {
	constructor(app, appState, api, offer = null) {
		super(app);
		this.api = api
		this.appState = appState;
		this.rtc = null;
		this.offer = offer ? decompressRTC(atob(decodeURIComponent(offer))) : null;
	}

	async #offerProvided() {
		const answerPromise = (async () => {
			await this.createRtc(false);
			return await this.rtc.acceptOffer(JSON.stringify(this.offer));
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
					await this.rtc.send({ type: 'ready' });
				} else if (reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') {
					if (offerPromise.pending) offerPromise.cancel();
					if (this.rtc) this.rtc.close();
				}
			}
		}, { infoPromise: offerPromise, isAnswer: false, rtcManager: this.rtc })
	}

	async transitionToBattle() {
		await BaseView.switchView(BattleView, this.app, this.appState, this.api, true, this.rtc);
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
			div({ className: 'p-4' }, 'Lobby View'),
			p({}, `Loaded with offer: ${this.offer}`),
			div({ className: 'flex gap-2' },
				button({ onClick: async () => await this.#startRoom() }, 'Start Room'),
				button({ onClick: async () => await this.#joinRoom() }, 'Join Room')
			)
		);

		if (this.offer) await this.#offerProvided();
	}

	destroy() {
		this.app.innerHTML = '';
		if (this.rtc) this.rtc.close();
	}
}