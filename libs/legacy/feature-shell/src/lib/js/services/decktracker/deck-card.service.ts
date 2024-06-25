import { Injectable } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState } from '@firestone/game-state';
import { arraysEqual, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../localization-facade.service';

@Injectable()
export class DeckCardService {
	constructor(private cards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfoInDeck(deckState: DeckState): DeckState {
		const newBoard = this.fillZone(deckState.board, deckState);
		const newDeck = this.fillZone(deckState.deck, deckState);
		const newHand = this.fillZone(deckState.hand, deckState);
		const newOtherZone = this.fillZone(deckState.otherZone, deckState);

		const hasChanged =
			newBoard !== deckState.board ||
			newDeck !== deckState.deck ||
			newHand !== deckState.hand ||
			newOtherZone !== deckState.otherZone;
		return hasChanged
			? deckState.update({
					board: this.fillZone(deckState.board, deckState),
					deck: this.fillZone(deckState.deck, deckState),
					hand: this.fillZone(deckState.hand, deckState),
					otherZone: this.fillZone(deckState.otherZone, deckState),
			  })
			: deckState;
	}

	private fillZone(zone: readonly DeckCard[], deckState: DeckState): readonly DeckCard[] {
		if (!zone) {
			return zone;
		}

		const newZone = zone.map((card) => (card.cardId ? this.doFillCard(card, deckState) : card));
		if (deepEqual(newZone, zone)) {
			return zone;
		}

		// console.debug('[deck-card] fillZone', zone, newZone);
		return newZone;
	}

	private doFillCard(card: DeckCard, deckState: DeckState): DeckCard {
		// const dbCard = this.cards.getCard(card.cardId);
		// if (!dbCard) {
		// 	return card;
		// }

		if (!!card.relatedCardIds?.length) {
			return card;
		}

		const relatedCardIds = this.buildContextRelatedCardIds(card, deckState);
		if (arraysEqual(relatedCardIds, card.relatedCardIds)) {
			return card;
		}

		// console.debug('[deck-card] doFillCard before', card.cardId, card.relatedCardIds, card);
		const result = card.update({
			// cardName: card.cardName ?? this.i18n.getCardName(card.cardId) ?? this.i18n.getCardName(dbCard.id),
			// manaCost: card.manaCost ?? dbCard.cost,
			// rarity: card.rarity ?? dbCard.rarity ? (card.rarity ?? dbCard.rarity).toLowerCase() : undefined,
			relatedCardIds: this.buildContextRelatedCardIds(card, deckState),
		} as DeckCard);
		// console.debug('[deck-card] doFillCard after', card.cardId, card.relatedCardIds, card);
		return result;
	}

	private buildContextRelatedCardIds(card: DeckCard, deckState: DeckState): readonly string[] {
		switch (card.cardId) {
			case CardIds.ETCBandManager_ETC_080:
			case CardIds.ZilliaxDeluxe3000_TOY_330:
				return deckState.sideboards?.find((s) => s.keyCardId === card.cardId)?.cards ?? [];
			case CardIds.StarlightWhelp:
			case CardIds.HexLordMalacrass:
				return deckState.cardsInStartingHand?.map((c) => c.cardId) ?? [];
		}
		return card.relatedCardIds;
	}
}
