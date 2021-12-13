import { SceneMode } from '@firestone-hs/reference-data';
import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';
import { MercenariesOutOfCombatOverlayHandler } from './_mercenaries-out-of-combat-overlay-handler';

export class MercenariesOutOfCombatTeamOverlayHandler implements MercenariesOutOfCombatOverlayHandler {
	constructor(private readonly ow: OverwolfService) {}

	public async updateOverlay(
		state: MercenariesOutOfCombatState,
		currentScene: SceneMode,
		preferences: Preferences,
	): Promise<void> {
		// const prefs = await this.prefs.getPreferences();
		const windowId = OverwolfService.MERCENARIES_OUT_OF_COMBAT_PLAYER_TEAM_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const scenes = [];
		if (preferences?.mercenariesEnableOutOfCombatPlayerTeamWidget) {
			scenes.push(SceneMode.LETTUCE_MAP);
		}
		if (preferences?.mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage) {
			scenes.push(SceneMode.LETTUCE_BOUNTY_TEAM_SELECT, SceneMode.LETTUCE_COLLECTION);
		}
		const shouldShow = !!state && scenes.includes(currentScene);
		console.debug('should show?', state, currentScene, scenes, preferences);
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(windowId);
		}
	}
}
