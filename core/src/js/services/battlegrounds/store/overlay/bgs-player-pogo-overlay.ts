import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { isWindowClosed } from '../../../utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsPlayerPogoOverlay implements BattlegroundsOverlay {
	private showCounter: boolean;

	constructor(private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Do nothing
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.showCounter = preferences.playerBgsPogoCounter && preferences.bgsFullToggle;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const inGame = await this.ow.inGame();
		const theWindow = await this.ow.getWindowState(OverwolfService.BGS_COUNTER_PLAYER_POGO_WINDOW);
		const shouldShowWindow = state.currentGame?.replayXml == null && state.currentGame?.pogoHoppersCount > 0;

		if (inGame && shouldShowWindow && isWindowClosed(theWindow.window_state_ex) && this.showCounter) {
			await this.ow.obtainDeclaredWindow(OverwolfService.BGS_COUNTER_PLAYER_POGO_WINDOW);
			await this.ow.restoreWindow(OverwolfService.BGS_COUNTER_PLAYER_POGO_WINDOW);
		} else if (!isWindowClosed(theWindow.window_state_ex) && (!shouldShowWindow || !inGame || !this.showCounter)) {
			await this.ow.closeWindow(OverwolfService.BGS_COUNTER_PLAYER_POGO_WINDOW);
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState): Promise<void> {
		// Do nothing
	}
}
