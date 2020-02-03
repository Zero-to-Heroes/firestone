import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class GameEndParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState, prefs?: Preferences): boolean {
		return prefs && prefs.decktrackerCloseOnGameEnd && state && gameEvent.type === GameEvent.GAME_END;
	}

	async parse(): Promise<GameState> {
		return new GameState();
	}

	event(): string {
		return DeckEvents.GAME_END;
	}
}
