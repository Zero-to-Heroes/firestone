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
			cardName: this.buildCardName(cardData, gameEvent.data[4]),
			manaCost: cardData.cost,
			rarity: cardData.rarity ? cardData.rarity.toLowerCase() : null,
		} as DeckCard);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			deck: newDeck
		});
		console.log('received card in deck', cardId, newPlayerDeck);
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
		return "Unkown card";
	}
}