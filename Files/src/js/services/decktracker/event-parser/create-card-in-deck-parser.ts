import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper } from "./deck-manipulation-helper";

export class CreateCardInDeckParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.CREATE_CARD_IN_DECK) {
			return false;
		}
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		return controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return;
		}
		const cardId: string = gameEvent.data[0];
		const cardData = cardId != null ? this.allCards.getCard(cardId) : null;
		const card = Object.assign(new DeckCard(), {
			cardId: cardId,
			totalQuantity: 1,
			cardName: this.buildCardName(cardData, gameEvent.data[4]),
			manaCost: cardData ? cardData.cost : undefined,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
		} as DeckCard);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			deck: newDeck
		});
		if (!card.cardId) {
			console.log('Adding unidentified card in deck', card, gameEvent);
		}
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CREATE_CARD_IN_DECK;
	}

	private buildCardName(card: any, creatorCardId: string): string {
		if (card) {
			return card.name;
		}
		if (creatorCardId) {
			const creator = this.allCards.getCard(creatorCardId);
			return `Created by ${creator.name}`;
		}
		return "Unknown card";
	}
}