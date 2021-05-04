import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';

@Injectable()
export class DeckCardService {
	constructor(private cards: AllCardsService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfoInDeck(deckState: DeckState): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.fillZone(deckState.board),
			deck: this.fillZone(deckState.deck),
			hand: this.fillZone(deckState.hand),
			otherZone: this.fillZone(deckState.otherZone),
		} as DeckState);
	}

	private fillZone(zone: readonly DeckCard[]): readonly DeckCard[] {
		return zone ? zone.map((card) => (card.cardId ? this.doFillCard(card) : card)) : zone;
	}

	private doFillCard(card: DeckCard): DeckCard {
		const dbCard = this.cards.getCard(card.cardId);
		if (!dbCard) {
			return card;
		}
		return card.update({
			cardName: card.cardName || dbCard.name,
			manaCost: card.manaCost ?? dbCard.cost,
			rarity: card.rarity || dbCard.rarity ? (card.rarity || dbCard.rarity)?.toLowerCase() : undefined,
		} as DeckCard);
	}
}
