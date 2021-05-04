import { Injectable } from '@angular/core';
import { CardMetaInfo } from '../../models/decktracker/card-meta-info';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';

@Injectable()
export class GameStateMetaInfoService {
	public updateDeck(deckState: DeckState, currentTurn: number | 'mulligan'): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.cleanZone(deckState.board),
			deck: this.cleanZone(deckState.deck),
			hand: this.updateZone(deckState.hand, currentTurn),
			otherZone: this.cleanZone(deckState.otherZone),
		} as DeckState);
	}

	// If the card goes back to deck / board, we want to reset the counter, as it doesn't
	// provide any meaningful info anymore
	private cleanZone(zone: readonly DeckCard[]): readonly DeckCard[] {
		return zone.map((card) =>
			card.metaInfo.turnAtWhichCardEnteredCurrentZone === undefined ? card : this.cleanCard(card),
		);
	}

	private cleanCard(card: DeckCard): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: undefined,
		} as CardMetaInfo);
		return card.update({
			metaInfo: newMeta,
		} as DeckCard);
	}

	private updateZone(zone: readonly DeckCard[], currentTurn: number | 'mulligan'): readonly DeckCard[] {
		return zone.map((card) =>
			card.metaInfo.turnAtWhichCardEnteredCurrentZone === undefined ? this.updateCard(card, currentTurn) : card,
		);
	}

	private updateCard(card: DeckCard, currentTurn: number | 'mulligan'): DeckCard {
		const newMeta = Object.assign(new CardMetaInfo(), card.metaInfo, {
			turnAtWhichCardEnteredCurrentZone: currentTurn,
		} as CardMetaInfo);
		return card.update({
			metaInfo: newMeta,
		} as DeckCard);
	}
}
