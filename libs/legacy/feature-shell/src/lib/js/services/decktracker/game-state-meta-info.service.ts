import { Injectable } from '@angular/core';
import { CardMetaInfo, DeckCard, DeckState } from '@firestone/game-state';

@Injectable()
export class GameStateMetaInfoService {
	public updateDeck(deckState: DeckState, currentTurn: number | 'mulligan'): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.cleanZone(deckState.board, true),
			deck: this.cleanBottomPositions(this.cleanZone(deckState.deck, false)),
			hand: this.updateHand(deckState.hand, currentTurn, true),
			otherZone: this.cleanZone(deckState.otherZone, true),
		} as DeckState);
	}

	private cleanBottomPositions(deck: readonly DeckCard[]): readonly DeckCard[] {
		const result = [...deck]
			.sort((a, b) => (a.positionFromBottom ?? 0) - (b.positionFromBottom ?? 0))
			.sort((a, b) => (a.positionFromTop ?? 0) - (b.positionFromTop ?? 0))
			.map((card, index) =>
				card.update({
					positionFromTop: card.positionFromTop == undefined ? undefined : index + 1,
				}),
			);
		return result;
	}

	// If the card goes back to deck / board, we want to reset the counter, as it doesn't
	// provide any meaningful info anymore
	private cleanZone(zone: readonly DeckCard[], removeBottomInfo: boolean): readonly DeckCard[] {
		return zone.map((card) =>
			card.metaInfo.turnAtWhichCardEnteredCurrentZone === undefined
				? card
				: this.cleanCard(card, removeBottomInfo),
		);
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
		zone: readonly DeckCard[],
		currentTurn: number | 'mulligan',
		removeBottomInfo: boolean,
	): readonly DeckCard[] {
		return zone.map((card) => this.updateCardInHand(card, currentTurn, removeBottomInfo));
	}

	private updateCardInHand(card: DeckCard, currentTurn: number | 'mulligan', removeBottomInfo: boolean): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: card.metaInfo.turnAtWhichCardEnteredCurrentZone ?? currentTurn,
			turnAtWhichCardEnteredHand: card.metaInfo.turnAtWhichCardEnteredHand ?? currentTurn,
		} as CardMetaInfo);
		return card.update({
			metaInfo: newMeta,
			positionFromBottom: removeBottomInfo ? undefined : card.positionFromBottom,
		} as DeckCard);
	}
}
