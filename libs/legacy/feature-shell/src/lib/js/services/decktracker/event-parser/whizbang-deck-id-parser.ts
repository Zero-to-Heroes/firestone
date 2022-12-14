import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckHandlerService } from '../deck-handler.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { DeckstringOverrideParser } from './deckstring-override-parser';
import { EventParser } from './event-parser';

export class WhizbangDeckParser implements EventParser {
	constructor(private readonly deckParser: DeckParserService, private readonly deckHandler: DeckHandlerService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.WHIZBANG_DECK_ID;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const deckId = gameEvent.additionalData.deckId;
		console.log('parsing whizbang deck', deckId);

		const deck = await this.deckParser.getTemplateDeck(
			deckId,
			currentState.metadata?.scenarioId,
			currentState.metadata?.gameType,
		);
		console.log('got whizbang deck', deck);
		if (!deck) {
			return currentState;
		}

		const stateAfterPlayerDeckUpdate = await new DeckstringOverrideParser(this.deckHandler).parse(
			currentState,
			new DeckstringOverrideEvent(deck.name, deck.deckstring, 'player'),
			null,
		);
		return stateAfterPlayerDeckUpdate;
	}

	event(): string {
		return GameEvent.WHIZBANG_DECK_ID;
	}
}
