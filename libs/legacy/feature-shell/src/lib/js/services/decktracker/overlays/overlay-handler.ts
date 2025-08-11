import { GameState } from '@firestone/game-state';
import { GameEvent, GameStateEvent } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';

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
