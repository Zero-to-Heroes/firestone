import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckEvents } from "./deck-events";

export class GameEndParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        return gameEvent.type === GameEvent.GAME_END;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
        return new GameState();
    }

	event(): string {
		return DeckEvents.GAME_END;
	}
}