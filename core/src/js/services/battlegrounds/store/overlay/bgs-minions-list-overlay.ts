import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsMinionsListOverlay implements BattlegroundsOverlay {
	private bgsActive = true;

	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.bgsActive =
			(preferences.bgsEnableMinionListOverlay || preferences.bgsShowTribesHighlight) && preferences.bgsFullToggle;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const windowId = OverwolfService.BATTLEGROUNDS_WINDOW_MINIONS_TIERS_OVERLAY;
		const battlegroundsWindow = await this.ow.getWindowState(windowId);
		const inGame = state && state.inGame && !state.currentGame?.gameEnded;
		await this.ow.obtainDeclaredWindow(windowId);
		// await this.ow.restoreWindow(windowId);
		if (inGame && this.bgsActive) {
			if (battlegroundsWindow.window_state_ex !== 'normal' && battlegroundsWindow.stateEx !== 'normal') {
				await this.ow.obtainDeclaredWindow(windowId);
				await this.ow.restoreWindow(windowId);
			}
		} else {
			await this.ow.closeWindow(windowId);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState, force = false) {
		// Do nothing
	}
}
