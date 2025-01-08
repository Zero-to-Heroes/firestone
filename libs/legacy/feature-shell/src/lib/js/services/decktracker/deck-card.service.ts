import { Injectable } from '@angular/core';
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, Metadata } from '@firestone/game-state';
import { arraysEqual, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../localization-facade.service';
import { getDynamicRelatedCardIds } from './card-highlight/dynamic-pools';

@Injectable()
export class DeckCardService {
	constructor(private allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfoInDeck(deckState: DeckState, metaData: Metadata): DeckState {
		const newBoard = this.fillZone(deckState.board, deckState, metaData);
		const newDeck = this.fillZone(deckState.deck, deckState, metaData);
		const newHand = this.fillZone(deckState.hand, deckState, metaData);
		const newOtherZone = this.fillZone(deckState.otherZone, deckState, metaData);

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

	private fillZone(zone: readonly DeckCard[], deckState: DeckState, metaData: Metadata): readonly DeckCard[] {
		if (!zone) {
			return zone;
		}

		const newZone = zone.map((card) => (card.cardId ? this.doFillCard(card, deckState, metaData) : card));
		if (deepEqual(newZone, zone)) {
			return zone;
		}

		// console.debug('[deck-card] fillZone', zone, newZone);
		return newZone;
	}

	private doFillCard(card: DeckCard, deckState: DeckState, metaData: Metadata): DeckCard {
		if (!!card.relatedCardIds?.length) {
			return card;
		}

		const relatedCardIds = this.buildContextRelatedCardIds(card, deckState, metaData);
		if (arraysEqual(relatedCardIds, card.relatedCardIds)) {
			return card;
		}

		// console.debug('[deck-card] doFillCard before', card.cardId, card.relatedCardIds, card);
		const result = card.update({
			// cardName: card.cardName ?? this.i18n.getCardName(card.cardId) ?? this.i18n.getCardName(dbCard.id),
			// manaCost: card.manaCost ?? dbCard.cost,
			// rarity: card.rarity ?? dbCard.rarity ? (card.rarity ?? dbCard.rarity).toLowerCase() : undefined,
			relatedCardIds: relatedCardIds,
		} as DeckCard);
		// console.debug('[deck-card] doFillCard after', card.cardId, card.relatedCardIds, card);
		return result;
	}

	private buildContextRelatedCardIds(card: DeckCard, deckState: DeckState, metaData: Metadata): readonly string[] {
		switch (card.cardId) {
			case CardIds.ETCBandManager_ETC_080:
			case CardIds.ZilliaxDeluxe3000_TOY_330:
				return deckState.sideboards?.find((s) => s.keyCardId === card.cardId)?.cards ?? [];
			case CardIds.StarlightWhelp:
			case CardIds.HexLordMalacrass:
				return deckState.cardsInStartingHand?.map((c) => c.cardId) ?? [];
			default:
				const dynamicCards = getDynamicRelatedCardIds(card.cardId, this.allCards.getService(), {
					format: metaData.formatType,
					gameType: metaData.gameType,
					currentClass: !deckState?.hero?.classes?.[0] ? '' : CardClass[deckState?.hero?.classes?.[0]],
				});
				return !!dynamicCards?.length ? dynamicCards : card.relatedCardIds;
		}
	}
}
