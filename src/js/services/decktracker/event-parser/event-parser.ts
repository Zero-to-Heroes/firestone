import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';

export interface EventParser {
	applies(gameEvent: GameEvent, state?: GameState, prefs?: Preferences): boolean;
	parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState>;
	event(): string;
}
