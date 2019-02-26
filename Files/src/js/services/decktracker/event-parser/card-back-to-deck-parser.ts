import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";

export class CardBackToDeckParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.CARD_BACK_TO_DECK) {
			return false;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[3];
		return cardId && controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const cardId: string = gameEvent.data[0];
		const initialZone: string = gameEvent.data[2];
		
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = previousDeck
				.map((card: DeckCard) => card.cardId === cardId ? this.increaseCardCount(card) : card)
				.filter((card) => card);
		console.log('new deck', newDeck);

		const newHand: ReadonlyArray<DeckCard> = this.buildNewHand(initialZone, currentState.playerDeck.hand, cardId);
		console.log('new hand', newDeck);

		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: { 
					deckList: currentState.playerDeck.deckList,
					deck: newDeck,
					hand: newHand
				} as DeckState
			});
	}	
	
	private buildNewHand(initialZone: string, previousHand: ReadonlyArray<DeckCard>, cardId: string): ReadonlyArray<DeckCard> {
		if (initialZone !== 'HAND') {
			return previousHand;
		}
		return previousHand
				.map((card: DeckCard) => card.cardId === cardId ? this.removeCard(card) : card);
	}
	
	private removeCard(card: DeckCard): DeckCard {
		if (card.totalQuantity == 1) {
			return null;
		}
		return Object.assign(new DeckCard(), card, {
			totalQuantity: card.totalQuantity - 1,
		});
	}
	
	private increaseCardCount(card: DeckCard): DeckCard {
		return Object.assign(new DeckCard(), card, {
			totalQuantity: card.totalQuantity + 1,
		});
	}
}