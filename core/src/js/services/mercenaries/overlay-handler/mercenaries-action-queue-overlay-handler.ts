import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { isWindowClosed } from '../../utils';
import { isMercenariesPvE, isMercenariesPvP } from '../mercenaries-utils';
import { MercenariesOverlayHandler } from './_mercenaries-overlay-handler';

export class MercenariesActionQueueOverlayHandler implements MercenariesOverlayHandler {
	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async handleDisplayPreferences(preferences: Preferences): Promise<void> {
		// Do nothing for now
	}

	public async updateOverlay(state: MercenariesBattleState, preferences: Preferences): Promise<void> {
		// const prefs = await this.prefs.getPreferences();
		const windowId = OverwolfService.MERCENARIES_ACTION_QUEUE_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const isPveAction = preferences?.mercenariesEnableActionsQueueWidgetPvE && isMercenariesPvE(state?.gameMode);
		const isPvPAction = preferences?.mercenariesEnableActionsQueueWidgetPvP && isMercenariesPvP(state?.gameMode);
		const shouldShow = !!state && (isPveAction || isPvPAction);
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(windowId);
		}
	}
}
