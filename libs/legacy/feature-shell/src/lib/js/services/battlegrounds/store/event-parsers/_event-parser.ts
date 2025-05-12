import { BattlegroundsState, GameState } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';

export interface EventParser {
	applies(gameEvent: BattlegroundsStoreEvent, state?: BattlegroundsState): boolean;
	parse(
		currentState: BattlegroundsState,
		gameEvent: BattlegroundsStoreEvent,
		// Try to avoid relying on it as much as possible, because it can create race conditions
		// with the game state service
		gameState?: GameState,
	): Promise<BattlegroundsState>;
}
