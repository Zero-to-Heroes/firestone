import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../models/game-event';

export interface ActionChainParser {
	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
}
