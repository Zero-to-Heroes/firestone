import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';

export interface ActionChainParser {
	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
}
