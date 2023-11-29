import { Injectable } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { DeckState } from '../../models/decktracker/deck-state';
import { LocalizationFacadeService } from '../localization-facade.service';

@Injectable()
export class DeckCardService {
	constructor(private cards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfoInDeck(deckState: DeckState): DeckState {
		return Object.assign(new DeckState(), deckState, {
			board: this.fillZone(deckState.board, deckState),
			deck: this.fillZone(deckState.deck, deckState),
			hand: this.fillZone(deckState.hand, deckState),
			otherZone: this.fillZone(deckState.otherZone, deckState),
		} as DeckState);
	}

	private fillZone(zone: readonly DeckCard[], deckState: DeckState): readonly DeckCard[] {
		return zone ? zone.map((card) => (card.cardId ? this.doFillCard(card, deckState) : card)) : zone;
	}

	private doFillCard(card: DeckCard, deckState: DeckState): DeckCard {
		// if (card.cardName != null && card.manaCost != null && card.rarity != null && !!card.relatedCardIds?.length) {
		// 	return card;
		// }

		const dbCard = this.cards.getCard(card.cardId);
		if (!dbCard) {
			return card;
		}

		return card.update({
			cardName: card.cardName ?? this.i18n.getCardName(card.cardId) ?? this.i18n.getCardName(dbCard.id),
			manaCost: card.manaCost ?? dbCard.cost,
			rarity: card.rarity ?? dbCard.rarity ? (card.rarity ?? dbCard.rarity).toLowerCase() : undefined,
			relatedCardIds: this.buildContextRelatedCardIds(card, deckState),
		} as DeckCard);
	}

	private buildContextRelatedCardIds(card: DeckCard, deckState: DeckState): readonly string[] {
		switch (card.cardId) {
			case CardIds.ETCBandManager_ETC_080:
				return deckState.sideboards?.find((s) => s.keyCardId === card.cardId)?.cards ?? [];
			case CardIds.StarlightWhelp:
			case CardIds.HexLordMalacrass:
				return deckState.cardsInStartingHand?.map((c) => c.cardId) ?? [];
		}
		return card.relatedCardIds;
	}
}
