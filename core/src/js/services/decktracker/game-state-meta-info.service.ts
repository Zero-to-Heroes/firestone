import { Injectable } from '@angular/core';
import { CardMetaInfo } from '../../models/decktracker/card-meta-info';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';

@Injectable()
export class GameStateMetaInfoService {
	public updateDeck(deckState: DeckState, currentTurn: number | 'mulligan'): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.cleanZone(deckState.board, true),
			deck: this.cleanBottomPositions(this.cleanZone(deckState.deck, false)),
			hand: this.updateZone(deckState.hand, currentTurn, true),
			otherZone: this.cleanZone(deckState.otherZone, true),
		} as DeckState);
	}

	private cleanBottomPositions(deck: readonly DeckCard[]): readonly DeckCard[] {
		return [...deck]
			.sort((a, b) =>
				a.positionFromBottom == null
					? 1
					: b.positionFromBottom == null
					? -1
					: a.positionFromBottom - b.positionFromBottom,
			)
			.map((card, index) =>
				card.update({
					positionFromBottom: card.positionFromBottom == undefined ? undefined : index + 1,
				}),
			)
			.sort((a, b) =>
				a.positionFromTop == null ? -1 : b.positionFromTop == null ? 1 : b.positionFromTop - a.positionFromTop,
			)
			.map((card, index) =>
				card.update({
					positionFromTop: card.positionFromTop == undefined ? undefined : index + 1,
				}),
			);
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

	private updateZone(
		zone: readonly DeckCard[],
		currentTurn: number | 'mulligan',
		removeBottomInfo: boolean,
	): readonly DeckCard[] {
		return zone.map((card) =>
			card.metaInfo.turnAtWhichCardEnteredCurrentZone === undefined
				? this.updateCard(card, currentTurn, removeBottomInfo)
				: card,
		);
	}

	private updateCard(card: DeckCard, currentTurn: number | 'mulligan', removeBottomInfo: boolean): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: currentTurn,
		} as CardMetaInfo);
		return card.update({
			metaInfo: newMeta,
			positionFromBottom: removeBottomInfo ? undefined : card.positionFromBottom,
		} as DeckCard);
	}
}
