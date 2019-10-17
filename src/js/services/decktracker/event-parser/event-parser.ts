import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';

export interface EventParser {
	applies(gameEvent: GameEvent): boolean;
	parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState>;
	event(): string;
}
