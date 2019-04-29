import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper as DeckManipulationHelper } from "./deck-manipulation-helper";
import { AllCardsService } from "../../all-cards.service";

export class MinionSummonedParser implements EventParser {

    constructor(private cards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.MINION_SUMMONED) {
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
		const dbCard = this.cards.getCard(cardId);
		const card = Object.assign(new DeckCard(), {
            cardId: cardId,
            entityId: entityId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
		} as DeckCard);
		const previousOtherZone = currentState.playerDeck.otherZone;
		const newOtherZone: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, 
			{
				otherZone: newOtherZone
			} as DeckState);
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.MINION_SUMMONED;
	}
}