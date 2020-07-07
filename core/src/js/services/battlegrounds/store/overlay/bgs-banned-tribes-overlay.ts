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
		this.active = preferences.bgsShowBannedTribesOverlay;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const windowId = OverwolfService.BATTLEGROUNDS_BANNED_TRIBES_WINDOW;
		const window = await this.ow.getWindowState(windowId);
		const inGame = state && state.inGame && !state.gameEnded;
		if (inGame && this.active) {
			// console.log('[bgs-simulation-overlay] showing window', window);
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
			// console.log('[bgs-simulation-overlay] restored window', window);
		} else if (!isWindowClosed(window.window_state_ex) && !isWindowClosed(window.stateEx)) {
			// console.log('[bgs-simulation-overlay] closing window', window);
			await this.ow.hideWindow(windowId);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState) {
		// Do nothing
	}
}
