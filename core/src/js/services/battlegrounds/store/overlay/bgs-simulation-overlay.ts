import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { Preferences } from '../../../../models/preferences';
import { OverwolfService } from '../../../overwolf.service';
import { PreferencesService } from '../../../preferences.service';
import { isWindowClosed } from '../../../utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BattlegroundsOverlay } from './battlegrounds-overlay';

export class BgsSimulationOverlay implements BattlegroundsOverlay {
	// private closedByUser: boolean;
	private active = true;

	constructor(private readonly prefs: PreferencesService, private readonly ow: OverwolfService) {}

	public async processEvent(gameEvent: BattlegroundsStoreEvent) {
		// Nothing to do yet
	}

	public async handleDisplayPreferences(preferences: Preferences) {
		this.active = preferences.bgsEnableBattleSimulationOverlay;
	}

	public async updateOverlay(state: BattlegroundsState) {
		const windowId = OverwolfService.BATTLEGROUNDS_BATTLE_SIMULATION_WINDOW_OVERLAY;
		const window = await this.ow.getWindowState(windowId);
		const inGame = state && state.inGame && !state.gameEnded;
		if (inGame && this.active) {
			if (isWindowClosed(window.window_state_ex)) {
				// console.log('[bgs-simulation-overlay] showing window', await this.ow.getWindowState(windowId));
				await this.ow.obtainDeclaredWindow(windowId);
				await this.ow.restoreWindow(windowId);
				// console.log('[bgs-simulation-overlay] restored window', await this.ow.getWindowState(windowId));
			}
		} else if (!isWindowClosed(window.window_state_ex) && !isWindowClosed(window.stateEx)) {
			await this.ow.closeWindow(windowId);
			// console.log('[bgs-simulation-overlay] hid window', await this.ow.getWindowState(windowId));
		}
	}

	public async handleHotkeyPressed(state: BattlegroundsState) {
		// Do nothing
	}
}
