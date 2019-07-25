import { Injectable } from "@angular/core";
import { DeckState } from "../../models/decktracker/deck-state";
import { DeckCard } from "../../models/decktracker/deck-card";
import { AllCardsService } from "../all-cards.service";

@Injectable()
export class ZoneOrderingService {

	constructor(private cards: AllCardsService) { }

    public orderZones(deckState: DeckState, stateFromTracker): DeckState {
		// return deckState;
		if (!stateFromTracker) {
			return deckState;
		}
		const newBoard = stateFromTracker.Board ? this.orderZone(deckState.board, stateFromTracker.Board) : deckState.board;
		const newHand = stateFromTracker.Hand ? this.orderZone(deckState.hand, stateFromTracker.Hand) : deckState.hand;
		
        return Object.assign(new DeckState(), deckState, {
			board: newBoard,
			hand: newHand,
        } as DeckState);
	}

	private orderZone(zone: ReadonlyArray<DeckCard>, stateFromTracker: any[]): ReadonlyArray<DeckCard> {
		const trackerEntityIds = stateFromTracker.map(entity => entity.entityId);
		// const trackerCardIds = stateFromTracker.map(entity => entity.cardId);
		if (zone.some(card => !card.entityId)) {
			console.error('Trying to order zone without entityId', zone);
		}
		// The tracker state is already correclty ordered
		// console.log('ordering zone', zone, stateFromTracker);
		const sorted = [...zone].sort((a, b) => {
			// console.log('sorting', a, b, trackerEntityIds.indexOf(a.entityId), trackerEntityIds.indexOf(b.entityId))	
			return trackerEntityIds.indexOf(a.entityId) - trackerEntityIds.indexOf(b.entityId)
		});
		// console.log('sorted, ', sorted)
		return sorted;
	}
}