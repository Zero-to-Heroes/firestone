import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class WhizbangDeckParser implements EventParser {
	constructor(private readonly deckParser: DeckParserService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.WHIZBANG_DECK_ID;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const deckId = gameEvent.additionalData.deckId;
		console.debug('parsing whizbang deck', deckId);

		const deck = await this.deckParser.getWhizbangDeck(deckId);
		console.debug('got whizbang deck', deck);

		// This updates the current deck in the deck parser, which will then be picked up by the
		// metadata parser
		return currentState;
	}

	event(): string {
		return GameEvent.WHIZBANG_DECK_ID;
	}
}
