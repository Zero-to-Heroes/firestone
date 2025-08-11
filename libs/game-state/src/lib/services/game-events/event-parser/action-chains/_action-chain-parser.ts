import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';

/** @deprecated */
export interface ActionChainParser {
	appliesOnEvent(): GameEvent['type'];
	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
}
