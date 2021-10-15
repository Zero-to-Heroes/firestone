import { MercenariesOutOfCombatState } from '../../../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';
import { MercenariesOutOfCombatOverlayHandler } from './_mercenaries-out-of-combat-overlay-handler';

export class MercenariesOutOfCombatTreasureSelectionOverlayHandler implements MercenariesOutOfCombatOverlayHandler {
	constructor(private readonly ow: OverwolfService) {}

	public async updateOverlay(state: MercenariesOutOfCombatState, preferences: Preferences): Promise<void> {
		// const prefs = await this.prefs.getPreferences();
		const windowId = OverwolfService.MERCENARIES_OUT_OF_COMBAT_TREASURE_SELECTION_WINDOW;
		const theWindow = await this.ow.getWindowState(windowId);
		const shouldShow =
			!!state && preferences?.mercenariesHighlightSynergies && !!state.treasureSelection?.treasures?.length;
		if (shouldShow && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!shouldShow && !isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.closeWindow(windowId);
		}
	}
}
