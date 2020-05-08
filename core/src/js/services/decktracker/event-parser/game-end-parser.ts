import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class GameEndParser implements EventParser {
	constructor(private readonly prefs: PreferencesService, private readonly deckParser: DeckParserService) {}

	applies(gameEvent: GameEvent, state: GameState, prefs?: Preferences): boolean {
		return gameEvent.type === GameEvent.GAME_END;
	}

	async parse(currentState: GameState): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();
		this.deckParser.reset();
		if (prefs && prefs.decktrackerCloseOnGameEnd) {
			return new GameState();
		}
		return currentState;
	}

	event(): string {
		return DeckEvents.GAME_END;
	}
}
