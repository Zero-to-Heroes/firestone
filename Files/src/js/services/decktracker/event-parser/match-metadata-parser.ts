import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckEvents } from "./deck-events";
import { Metadata } from "../../../models/decktracker/metadata";
import { FormatType } from "../../../models/enums/format-type";

export class MatchMetadataParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        return gameEvent.type === GameEvent.MATCH_METADATA;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		return Object.assign(new GameState(), currentState, { 
			metadata: {
				gameType: gameEvent.data[0].GameType as number,
				formatType: gameEvent.data[0].FormatType as number,
				scenarioId: gameEvent.data[0].ScenarioID as number,
			} as Metadata
		} as GameState);
    }

	event(): string {
		return DeckEvents.MATCH_METADATA;
	}
}