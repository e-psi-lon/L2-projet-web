import BaseView from "@ui/BaseView.js";
import ShowRtcInfoDialog from "@dialogs/ShowRtcInfoDialog.js";
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
			this.rtc = new WebRTCManager(false);
			await this.rtc.init();
			return await this.rtc.createAnswer();
		})();
		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
			onClose: async (div, reason) => {
				if (reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') {
					if (answerPromise.pending) answerPromise.cancel();
					if (this.rtc) this.rtc.close();
				}
			}
		}, { infoPromise: answerPromise, isAnswer: true })
	}

	async #startRoom() {
		const offerPromise = (async () => {
			this.rtc = new WebRTCManager(true);
			await this.rtc.init();
			return await this.rtc.createOffer();
		})();

		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
			onClose: async (div, reason) => {
				if (reason === 'cancel' || reason === 'backdrop' || reason === 'x-button') {
					if (offerPromise.pending) offerPromise.cancel();
					if (this.rtc) this.rtc.close();
				}
			}
		}, { infoPromise: offerPromise, isAnswer: false })
	}

	async render() {
		render(this.app,
			div({ className: 'p-4' }, 'Lobby View'),
			p({}, `Loaded with offer: ${this.offer}`),
			button({ onClick: async () => await this.#startRoom() }, 'Start Room')
		);

		if (this.offer) await this.#offerProvided();
	}

	destroy() {
		this.app.innerHTML = '';
		if (this.rtc) this.rtc.close();
	}
}