import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsHeroSelectionOverlay implements BattlegroundsOverlay {
	private show: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.show = preferences.bgsShowHeroSelectionAchievements;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const inGame = state && state.inGame && !state.currentGame?.gameEnded && !state.heroSelectionDone;
		const windowId = OverwolfService.BATTLEGROUNDS_HERO_SELECTION_OVERLAY;
		const theWindow = await this.ow.getWindowState(windowId);

		// 	'should show?',
		// 	inGame,
		// 	this.show,
		// 	isWindowClosed(theWindow.window_state_ex),
		// 	windowId,
		// 	theWindow,
		// 	state,
		// );
		if (inGame && this.show && isWindowClosed(theWindow.window_state_ex)) {
			await this.ow.obtainDeclaredWindow(windowId);
			await this.ow.restoreWindow(windowId);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!inGame || !this.show)) {
			await this.ow.closeWindow(windowId);
		} else {
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState): Promise<void> {
		// Do nothing
	}
}
