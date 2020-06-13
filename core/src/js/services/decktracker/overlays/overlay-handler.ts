import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';

export interface OverlayHandler {
	processEvent(gameEvent: GameEvent, state: GameState, showDecktrackerFromGameMode: boolean);
	handleDisplayPreferences(preferences: Preferences);
	updateOverlay(
		state: GameState,
		showDecktrackerFromGameMode: boolean,
		shouldForceCloseSecretsHelper?: boolean,
		forceLogs?: boolean,
	): Promise<void>;
}
