import BaseView from "@ui/BaseView";

export default class BattleView extends BaseView {
    constructor(app, appState, api = null) {
            super(app);
            this.api = api || new PokeAPI();
            this.appState = appState;
            this.player1 = appState.getCurrentAccount();
            this.player2=null;
    }

    async render() {
        
    }

    destroy() {
		this.app.innerHTML = '';
	}
}
