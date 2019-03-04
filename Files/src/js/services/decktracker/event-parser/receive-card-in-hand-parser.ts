import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper } from "./deck-manipulation-helper";

export class ReceiveCardInHandParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.RECEIVE_CARD_IN_HAND) {
			return false;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		return cardId && controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		const cardId: string = gameEvent.data[0];
		const cardData = this.allCards.getCard(cardId);
		const card = Object.assign(new DeckCard(), {
			cardId: cardId,
			totalQuantity: 1,
			cardName: cardData.name,
			manaCost: cardData.cost,
			rarity: cardData.rarity ? cardData.rarity.toLowerCase() : null,
		} as DeckCard);
		const previousHand = currentState.playerDeck.hand;
		const newHand: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousHand, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hand: newHand
		});
		console.log('received card in hand', cardId, newPlayerDeck);
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.RECEIVE_CARD_IN_HAND;
	}
}