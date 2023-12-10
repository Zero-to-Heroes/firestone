import { GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';

export interface OverlayHandler {
	processEvent(
		gameEvent: GameEvent | GameStateEvent,
		state: GameState,
		showDecktrackerFromGameMode: boolean,
	): GameState;
	handleDisplayPreferences(preferences: Preferences);
	updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		forceCloseWidgets?: boolean,
		forceLogs?: boolean,
	): Promise<void>;
}
