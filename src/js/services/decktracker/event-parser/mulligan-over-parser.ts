import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { AllCardsService } from '../../all-cards.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class MulliganOverParser implements EventParser {
	constructor(private deckParser: DeckParserService, private allCards: AllCardsService) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.MULLIGAN_DONE;
	}

	parse(currentState: GameState): GameState {
		return Object.assign(new GameState(), currentState, {
			mulliganOver: true,
			currentTurn: 0,
		} as GameState);
	}

	event(): string {
		return DeckEvents.MULLIGAN_OVER;
	}
}
