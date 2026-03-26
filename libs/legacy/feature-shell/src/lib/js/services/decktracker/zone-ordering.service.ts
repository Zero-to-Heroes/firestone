import { Injectable } from '@angular/core';
import { DeckCard, DeckState, EntityLike } from '@firestone/game-state';
import { arraysEqual } from '@firestone/shared/framework/common';

@Injectable()
export class ZoneOrderingService {
	public orderZones(deckState: DeckState, boardEntities: readonly EntityLike[], handEntities: readonly EntityLike[]): DeckState {
		if (!boardEntities && !handEntities) {
			return deckState;
		}

		const newBoard = boardEntities ? this.orderZone(deckState.board, boardEntities) : deckState.board;
		const newHand = handEntities ? this.orderZone(deckState.hand, handEntities) : deckState.hand;

		const hasChanged = !arraysEqual(newBoard, deckState.board) || !arraysEqual(newHand, deckState.hand);

		return hasChanged
			? deckState.update({
					board: newBoard,
					hand: newHand,
			  })
			: deckState;
	}

	private orderZone(zone: readonly DeckCard[], stateFromTracker: readonly EntityLike[]): readonly DeckCard[] {
		if (zone.length !== stateFromTracker.length) {
			return zone;
		}

		const sorted = Array(stateFromTracker.length).fill(null);
		for (let i = 0; i < stateFromTracker.length; i++) {
			sorted[i] = zone.find((card) => card.entityId === stateFromTracker[i].Id);
			if (!sorted[i]) {
				return zone;
			}
		}

		return sorted;
	}
}
