import BaseView from "@ui/BaseView.js";
import ShowRtcInfoDialog from "@dialogs/ShowRtcInfoDialog.js";
import { displayDialog } from "@ui/dialog.js";
import { render } from "@ui/reactive.js"
import { button, div, p } from "@ui/dom.js";
import WebRTCManager from "@utils/WebRTCManager.js";

export default class LobbyView extends BaseView {
	constructor(app, appState, api, offer = null) {
		super(app);
		this.api = api
		this.appState = appState;
		this.rtc = null;
		this.offer = offer ? atob(decodeURIComponent(offer)) : null;
	}

	async #offerProvided() {
		this.rtc = new WebRTCManager(false);
		await this.rtc.init();
		const answer = await this.rtc.acceptOffer(this.offer);
		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
		}, { infos: answer, rtc: this.rtc })
	}

	async #startRoom() {
		this.rtc = new WebRTCManager(true);
		console.log("Starting room...");
		await this.rtc.init();
		const offer = await this.rtc.createOffer();

		await displayDialog({
			DialogComponentOrContent: ShowRtcInfoDialog,
		}, { infos: offer, rtc: this.rtc })
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
		this.rtc.close();
	}
}