import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper as DeckManipulationHelper } from "./deck-manipulation-helper";

export class CardRemovedFromDeckParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.CARD_REMOVED_FROM_DECK) {
			return false;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		return cardId && controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const cardId: string = gameEvent.data[0];
		const card = currentState.playerDeck.deck.find((card) => card.cardId === cardId);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(previousDeck, cardId);
		const previousOtherZone = currentState.playerDeck.otherZone;
		const newOtherZone: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, 
			{
				deck: newDeck,
				otherZone: newOtherZone
			} as DeckState);
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CARD_REMOVED_FROM_DECK;
	}
}