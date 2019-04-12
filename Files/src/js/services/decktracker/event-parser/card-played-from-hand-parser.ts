import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckParserService } from "../deck-parser.service";
import { AllCardsService } from "../../all-cards.service";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper as DeckManipulationHelper } from "./deck-manipulation-helper";

export class CardPlayedFromHandParser implements EventParser {

    constructor(private deckParser: DeckParserService, private allCards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
        if (gameEvent.type !== GameEvent.CARD_PLAYED) {
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
		const card = currentState.playerDeck.hand.find((card) => card.cardId === cardId);
		const newHand: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(
			currentState.playerDeck.hand, 
			card.cardId);
		const previousOtherZone = currentState.playerDeck.otherZone;
		const newOtherZone: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hand: newHand,
			otherZone: newOtherZone
		});
		return Object.assign(new GameState(), currentState, 
			{ 
				playerDeck: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CARD_PLAYED_FROM_HAND;
	}
}