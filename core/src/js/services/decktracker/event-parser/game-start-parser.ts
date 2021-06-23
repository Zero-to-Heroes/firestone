import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	constructor(
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
		private allCards: AllCardsService,
	) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.GAME_START;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return Object.assign(new GameState(), {
			gameStarted: true,
			playerDeck: DeckState.create({
				isFirstPlayer: false,
			} as DeckState),
			opponentDeck: DeckState.create({
				isFirstPlayer: false,
				isOpponent: true,
			} as DeckState),
			spectating: gameEvent.additionalData.spectating,
		} as GameState);
	}

	event(): string {
		return GameEvent.GAME_START;
	}
}
