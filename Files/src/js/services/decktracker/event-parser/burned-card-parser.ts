import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper as DeckManipulationHelper } from "./deck-manipulation-helper";

export class BurnedCardParser implements EventParser {

    constructor() { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.BURNED_CARD) {
			return false;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
		return cardId && controllerId === localPlayer.PlayerId
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
        const cardId: string = gameEvent.data[0];
        const entityId: number = gameEvent.data[4];
		if (!cardId && !entityId) {
			return currentState;
		}
		const card = DeckManipulationHelper.findCardInZone(currentState.playerDeck.deck, cardId, entityId);
		const previousDeck = currentState.playerDeck.deck;
		const newDeck: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(previousDeck, cardId, entityId);
        const cardWithZone = Object.assign(new DeckCard(), card, {
            zone: 'BURNED',
        } as DeckCard);
		const previousOtherZone = currentState.playerDeck.otherZone;
		const newOtherZone: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, cardWithZone);
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
		return DeckEvents.BURNED_CARD;
	}
}