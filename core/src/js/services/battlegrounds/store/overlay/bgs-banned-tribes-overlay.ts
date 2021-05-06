import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { isWindowClosed } from '../../../utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsBannedTribesOverlay implements BattlegroundsOverlay {
	private active = true;

	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Nothing to do yet
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.active = preferences.bgsShowBannedTribesOverlay && preferences.bgsFullToggle;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const windowId = OverwolfService.BATTLEGROUNDS_BANNED_TRIBES_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const inGame = state && state.inGame && !state.currentGame?.gameEnded;
		if (inGame && this.active && isWindowClosed(theWindow.window_state_ex)) {
			console.debug(
				'[bgs-banned-tribes-overlay] showing window',
				inGame,
				state.inGame,
				state?.currentGame?.gameEnded,
				this.active,
				theWindow.window_state_ex,
			);
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
			// console.log('[bgs-banned-tribes-overlay] restored window', window);
		} else if ((!inGame || !this.active) && !isWindowClosed(theWindow.window_state_ex)) {
			console.debug(
				'[bgs-banned-tribes-overlay] closing window',
				inGame,
				state.inGame,
				state?.currentGame?.gameEnded,
				this.active,
				theWindow.window_state_ex,
			);
			await this.ow.closeWindow(windowId);
		} else if ((!inGame || !this.active) && isWindowClosed(theWindow.window_state_ex)) {
			console.debug(
				'[bgs-banned-tribes-overlay] not opening window',
				inGame,
				state.inGame,
				state?.currentGame?.gameEnded,
				this.active,
				theWindow.window_state_ex,
			);
			await this.ow.closeWindow(windowId);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState) {
		// Do nothing
	}
}
