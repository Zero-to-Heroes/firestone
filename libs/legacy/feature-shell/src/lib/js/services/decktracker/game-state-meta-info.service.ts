import { Injectable } from '@angular/core';
import { CardMetaInfo, DeckCard, DeckState } from '@firestone/game-state';
import { arraysEqual } from '@firestone/shared/framework/common';

@Injectable()
export class GameStateMetaInfoService {
	public updateDeck(deckState: DeckState, currentTurn: number | 'mulligan'): DeckState {
		const newBoard = this.cleanZone(deckState.board, true);
		const newDeck = this.cleanZone(deckState.deck, false);
		const newHand = this.updateHand(deckState.hand, currentTurn, true);
		const newOtherZone = this.cleanZone(deckState.otherZone, true);

		const hasChanged =
			newBoard !== deckState.board ||
			newDeck !== deckState.deck ||
			newHand !== deckState.hand ||
			newOtherZone !== deckState.otherZone;

		return hasChanged
			? deckState.update({
					board: newBoard,
					deck: newDeck,
					hand: newHand,
					otherZone: newOtherZone,
			  })
			: deckState;
	}

	// If the card goes back to deck / board, we want to reset the counter, as it doesn't
	// provide any meaningful info anymore
	private cleanZone(zone: readonly DeckCard[], removeBottomInfo: boolean): readonly DeckCard[] {
		const newZone = zone.map((card) =>
			card.metaInfo.turnAtWhichCardEnteredCurrentZone === undefined
				? card
				: this.cleanCard(card, removeBottomInfo),
		);
		return arraysEqual(newZone, zone) ? zone : newZone;
	}

	private cleanCard(card: DeckCard, removeBottomInfo: boolean): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: undefined,
		} as CardMetaInfo);
		return card.update({
			metaInfo: newMeta,
			positionFromBottom: removeBottomInfo ? undefined : card.positionFromBottom,
		} as DeckCard);
	}

	private updateHand(
		hand: readonly DeckCard[],
		currentTurn: number | 'mulligan',
		removeBottomInfo: boolean,
	): readonly DeckCard[] {
		const newHand = hand.map((card) => this.updateCardInHand(card, currentTurn, removeBottomInfo));
		return arraysEqual(newHand, hand) ? hand : newHand;
	}

	private updateCardInHand(card: DeckCard, currentTurn: number | 'mulligan', removeBottomInfo: boolean): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: card.metaInfo.turnAtWhichCardEnteredCurrentZone ?? currentTurn,
			turnAtWhichCardEnteredHand: card.metaInfo.turnAtWhichCardEnteredHand ?? currentTurn,
		} as CardMetaInfo);
		const newBottomPosition = removeBottomInfo ? undefined : card.positionFromBottom;
		const hasChanged =
			newMeta.turnAtWhichCardEnteredCurrentZone !== card.metaInfo.turnAtWhichCardEnteredCurrentZone ||
			newMeta.turnAtWhichCardEnteredHand !== card.metaInfo.turnAtWhichCardEnteredHand ||
			newBottomPosition !== card.positionFromBottom;
		return hasChanged
			? card.update({
					metaInfo: newMeta,
					positionFromBottom: newBottomPosition,
			  })
			: card;
	}
}
