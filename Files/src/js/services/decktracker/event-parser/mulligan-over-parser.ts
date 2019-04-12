import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckEvents } from "./deck-events";

export class MulliganOverParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        return gameEvent.type === GameEvent.MULLIGAN_DONE;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return;
		}
		return Object.assign(new GameState(), currentState, { 
			mulliganOver: true
		} as GameState);
    }

	event(): string {
		return DeckEvents.MULLIGAN_OVER;
	}
}