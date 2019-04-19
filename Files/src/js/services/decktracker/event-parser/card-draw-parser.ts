import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper } from "./deck-manipulation-helper";

export class CardDrawParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.CARD_DRAW_FROM_DECK) {
			return false;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		return cardId && controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return;
		}
		const cardId: string = gameEvent.data[0];
		const card = DeckManipulationHelper.findCardInZone(currentState.playerDeck.deck, cardId);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(previousDeck, card.cardId);
		const previousHand = currentState.playerDeck.hand;
		const newHand: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousHand, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			deckList: currentState.playerDeck.deckList,
			deck: newDeck,
			hand: newHand
		});
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CARD_DRAW;
	}
}