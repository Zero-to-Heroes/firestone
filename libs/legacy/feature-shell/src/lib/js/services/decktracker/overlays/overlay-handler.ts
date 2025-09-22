import { GameState } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';

import { GameStateEvent } from '@firestone/app/common';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';

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
