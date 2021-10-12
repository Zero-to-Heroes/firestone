import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class GameEndParser implements EventParser {
	constructor(private readonly prefs: PreferencesService, private readonly deckParser: DeckParserService) {}

	applies(gameEvent: GameEvent, state: GameState, prefs?: Preferences): boolean {
		return (
			gameEvent.type === GameEvent.GAME_END ||
			// When we stop spectating, we trigger the game end actions
			(gameEvent.type === GameEvent.SPECTATING && !gameEvent.additionalData.spectating)
		);
	}

	async parse(currentState: GameState): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();

		// 	'[deck-parser] [game-end] resetting deck, shouldStorePreviousDeck?',
		// 	currentState.metadata.gameType === GameType.GT_VS_AI,
		// );
		// this.deckParser.reset(currentState.metadata.gameType === GameType.GT_VS_AI);
		if (prefs && prefs.decktrackerCloseOnGameEnd) {
			return new GameState();
		}
		return currentState.update({
			gameEnded: true,
		} as GameState);
	}

	event(): string {
		return GameEvent.GAME_END;
	}
}
