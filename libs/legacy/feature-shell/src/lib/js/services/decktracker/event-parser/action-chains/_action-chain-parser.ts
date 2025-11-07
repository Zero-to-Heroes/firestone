import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../../models/game-event';

export interface ActionChainParser {
	appliesOnEvent(): GameEvent['type'];
	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
}
