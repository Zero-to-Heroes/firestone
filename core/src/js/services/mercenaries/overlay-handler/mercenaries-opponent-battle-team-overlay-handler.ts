import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { isWindowClosed } from '../../utils';
import { MercenariesOverlayHandler } from './_mercenaries-overlay-handler';

export class MercenariesOpponentBattleTeamOverlayHandler implements MercenariesOverlayHandler {
	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async handleDisplayPreferences(preferences: Preferences): Promise<void> {
		// Do nothing for now
	}

	public async updateOverlay(state: MercenariesBattleState): Promise<void> {
		// const prefs = await this.prefs.getPreferences();
		const windowId = OverwolfService.MERCENARIES_OPPONENT_TEAM_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const shouldShow = !!state && !state.closedManually;
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(windowId);
		}
	}
}
