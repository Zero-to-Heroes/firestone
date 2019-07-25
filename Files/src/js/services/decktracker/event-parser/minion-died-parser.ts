import { EventParser } from "./event-parser";
import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";
import { DeckCard } from "../../../models/decktracker/deck-card";
import { DeckState } from "../../../models/decktracker/deck-state";
import { DeckEvents } from "./deck-events";
import { DeckManipulationHelper } from "./deck-manipulation-helper";
import { AllCardsService } from "../../all-cards.service";

export class MinionDiedParser implements EventParser {

    constructor(private cards: AllCardsService) { }

    applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.MINION_DIED;
    }    
    
    parse(currentState: GameState, gameEvent: GameEvent): GameState {
		if (currentState.playerDeck.deckList.length === 0) {
			return currentState;
		}
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		
		const isPlayer = cardId && controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = DeckManipulationHelper.findCardInZone(deck.board, cardId, entityId);

		const newBoard: ReadonlyArray<DeckCard> = DeckManipulationHelper.removeSingleCardFromZone(deck.board, cardId, entityId);
		const newOther: ReadonlyArray<DeckCard> = DeckManipulationHelper.addSingleCardToZone(deck.otherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, 
			{
				board: newBoard,
				otherZone: newOther
			} as DeckState);
		return Object.assign(new GameState(), currentState, 
			{ 
				[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck
			});
	}

	event(): string {
		return DeckEvents.MINION_DIED;
	}
}