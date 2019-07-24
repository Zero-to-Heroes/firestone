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
		return gameEvent.type === GameEvent.CARD_PLAYED;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const cardId: string = gameEvent.data[0];
		const controllerId: string = gameEvent.data[1];
		const localPlayer = gameEvent.data[2];
        const entityId: number = gameEvent.data[4];
		
		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.hand, cardId, entityId);
		
		const newHand: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(
			deck.hand, 
            cardId,
			entityId);
		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const newBoard: ReadonlyArray<DeckCard> = isOnBoard
				? DeckManipulationHelper.addSingleCardToZone(deck.board, card)
				: deck.board;
		const newOtherZone: ReadonlyArray<DeckCard> = isOnBoard
				? deck.otherZone
				: DeckManipulationHelper.addSingleCardToZone(deck.otherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			otherZone: newOtherZone
		});
		return Object.assign(new GameState(), currentState, 
			{ 
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.CARD_PLAYED_FROM_HAND;
	}
}