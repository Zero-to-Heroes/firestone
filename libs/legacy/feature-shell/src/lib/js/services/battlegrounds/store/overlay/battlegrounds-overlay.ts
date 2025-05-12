import { BattlegroundsState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';

export interface BattlegroundsOverlay {
	handleHotkeyPressed(state: BattlegroundsState, force: boolean): Promise<void>;
	updateOverlay(state: BattlegroundsState): Promise<void>;
	// handleDisplayPreferences(preferences: Preferences): Promise<void>;
	processEvent(gameEvent: BattlegroundsStoreEvent): Promise<void>;
}
