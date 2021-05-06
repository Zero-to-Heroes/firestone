import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../../../models/decktracker/game-state';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';

export interface EventParser {
	applies(gameEvent: BattlegroundsStoreEvent, state?: BattlegroundsState): boolean;
	parse(
		currentState: BattlegroundsState,
		gameEvent: BattlegroundsStoreEvent,
		gameState?: GameState,
	): Promise<BattlegroundsState>;
}
