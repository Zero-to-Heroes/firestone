import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper as DeckManipulationHelper } from "./deck-manipulation-helper";

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
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const cardId: string = gameEvent.data[0];
		const initialZone: string = gameEvent.data[2];
        const entityId: number = gameEvent.data[5];
		const card = this.findCard(initialZone, currentState.playerDeck, cardId, entityId);
		const newHand: ReadonlyArray<DeckCard> = this.buildNewHand(initialZone, currentState.playerDeck.hand, card);
		const newOther: ReadonlyArray<DeckCard> = this.buildNewOther(initialZone, currentState.playerDeck.otherZone, card);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			deck: newDeck,
			hand: newHand,
			otherZone: newOther
		} as DeckState);
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CARD_BACK_TO_DECK;
	}
	
	private findCard(initialZone: string, deckState: DeckState, cardId: string, entityId: number): DeckCard {
		if (initialZone === 'HAND') {
			return DeckManipulationHelper.findCardInZone(deckState.hand, cardId, entityId);
		}
		if (['PLAY', 'GRAVEYARD', 'REMOVEDFROMGAME', 'SETASIDE', 'SECRET'].indexOf(initialZone) !== -1) {
			return DeckManipulationHelper.findCardInZone(deckState.otherZone, cardId, entityId);
		}
		console.error('could not find card in card-back-to-deck', initialZone, cardId, deckState);
		return null;
	}
	
	private buildNewHand(initialZone: string, previousHand: ReadonlyArray<DeckCard>, movedCard: DeckCard): ReadonlyArray<DeckCard> {
		if (initialZone !== 'HAND') {
			return previousHand;
		}
		return DeckManipulationHelper.removeSingleCardFromZone(previousHand, movedCard.cardId, movedCard.entityId);
	}
	
	private buildNewOther(initialZone: string, previousOther: ReadonlyArray<DeckCard>, movedCard: DeckCard): ReadonlyArray<DeckCard> {
		if (['PLAY', 'GRAVEYARD', 'REMOVEDFROMGAME', 'SETASIDE', 'SECRET'].indexOf(initialZone) !== -1) {
			return DeckManipulationHelper.removeSingleCardFromZone(previousOther, movedCard.cardId, movedCard.entityId);
		}
		return previousOther;
	}
}