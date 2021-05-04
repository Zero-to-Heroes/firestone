import { Injectable } from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';

@Injectable()
export class ZoneOrderingService {
	public orderZones(deckState: DeckState, stateFromTracker): DeckState {
		// return deckState;
		if (!stateFromTracker) {
			return deckState;
		}
		const newBoard = stateFromTracker.Board
			? this.orderZone(deckState.board, stateFromTracker.Board)
			: deckState.board;
		const newHand = stateFromTracker.Hand ? this.orderZone(deckState.hand, stateFromTracker.Hand) : deckState.hand;

		return Object.assign(new DeckState(), deckState, {
			board: newBoard,
			hand: newHand,
		} as DeckState);
	}

	private orderZone(zone: readonly DeckCard[], stateFromTracker: any[]): readonly DeckCard[] {
		const trackerEntityIds = stateFromTracker.map((entity) => entity.entityId);
		// const trackerCardIds = stateFromTracker.map(entity => entity.cardId);
		if (zone.some((card) => !card.entityId)) {
			console.error('Trying to order zone without entityId', zone);
		}
		// The tracker state is already correclty ordered
		// console.log('ordering zone', zone, stateFromTracker);
		const sorted = [...zone].sort((a, b) => {
			// console.log('sorting', a, b, trackerEntityIds.indexOf(a.entityId), trackerEntityIds.indexOf(b.entityId))
			// When the card arrives in the zone, there are a few different cases:
			// - The event causing it to arrive is a BLOCK, in which case the ZONE_POSITION tag has already been
			// processed, and the position is correct
			// - The event is a TAG_CHANGE, in which case it has not been processed. In this case, we add it at the end
			// This works for card draws. It's theoretically possible to have a card played through a TAG_CHANGED,
			// but I don't have any example here. In this case, it won't work until the next update of the game state
			// So this is a hack, but it should work in most cases.
			// If not, we can maybe do something by sending an event AFTER a ZONE_POSITION tag change
			return this.indexOf(trackerEntityIds, a.entityId) - this.indexOf(trackerEntityIds, b.entityId);
		});
		// console.log('sorted, ', sorted)
		return sorted;
	}

	private indexOf(collection: any[], item): number {
		const index = collection.indexOf(item);
		if (index === -1) {
			return 99;
		}
		return index;
	}
}
