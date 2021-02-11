import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsOverlayButtonOverlay implements BattlegroundsOverlay {
	private showButton: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showButton = preferences.bgsFullToggle && preferences.bgsEnableApp && preferences.bgsShowOverlayButton;
	}

	public async updateOverlay(state: BattlegroundsState) {
		// const inGame = await this.ow.inGame();
		const inGame = state && state.inGame;
		const windowId = OverwolfService.BATTLEGROUNDS_OVERLAY_BUTTON_OVERLAY_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		if (inGame && this.showButton && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!inGame || !this.showButton)) {
			await this.ow.closeWindow(windowId);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState): Promise<void> {
		// Do nothing
	}
}
