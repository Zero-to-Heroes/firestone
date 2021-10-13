import { SceneMode } from '@firestone-hs/reference-data';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';

const SCENE_IN_WHICH_TO_SHOW_OVERLAY = [SceneMode.LETTUCE_MAP];

export class MercenariesOutOfCombatTeamOverlayHandler implements MercenariesOutOfCombatTeamOverlayHandler {
	constructor(private readonly ow: OverwolfService) {}

	public async updateOverlay(state: MercenariesOutOfCombatState, preferences: Preferences): Promise<void> {
		// const prefs = await this.prefs.getPreferences();
		const windowId = OverwolfService.MERCENARIES_OUT_OF_COMBAT_PLAYER_TEAM_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const shouldShow =
			!!state &&
			SCENE_IN_WHICH_TO_SHOW_OVERLAY.includes(state.currentScene) &&
			// !state.outOfCombatPlearTeamWindowClosedManually &&
			preferences?.mercenariesEnableOutOfCombatPlayerTeamWidget &&
			!!state.mercenariesMemoryInfo?.Map?.PlayerTeam;
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(windowId);
		}
	}
}
