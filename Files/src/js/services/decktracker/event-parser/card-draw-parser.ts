import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";

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
		const cardId: string = gameEvent.data[0];
		const previousDeck = currentState.playerDeck.deck;
		console.log('drawing card', cardId, previousDeck, gameEvent);
		const deckAfterDraw: ReadonlyArray<DeckCard> = previousDeck
				.map((card: DeckCard) => card.cardId === cardId ? this.removeCard(card) : card)
				.filter((card) => card);
		console.log('new deck', deckAfterDraw);
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: { 
					deckList: currentState.playerDeck.deckList,
					deck: deckAfterDraw
				} as DeckState
			});
	}
	
	private removeCard(card: DeckCard): DeckCard {
		if (card.totalQuantity == 1) {
			console.log('removing card', card);
			return null;
		}
		console.log('not removing card?', card.cardId, card);
		return Object.assign(new DeckCard(), card, {
			totalQuantity: card.totalQuantity - 1,
		});
	}
}