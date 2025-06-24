/* eslint-disable no-case-declarations */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../models/deck-state';
import { GameState } from '../models/game-state';
import { Metadata } from '../models/metadata';
import { getDynamicRelatedCardIds, hasOverride } from './dynamic-pools';

export const buildContextRelatedCardIds = (
	cardId: string,
	existingRelatedCardIds: readonly string[],
	deckState: DeckState,
	metaData: Metadata,
	allCards: CardsFacadeService,
	gameState: GameState,
	validArenaPool: readonly string[],
): readonly string[] => {
	switch (cardId) {
		case CardIds.ETCBandManager_ETC_080:
		case CardIds.ZilliaxDeluxe3000_TOY_330:
			return deckState.sideboards?.find((s) => s.keyCardId === cardId)?.cards ?? [];
		case CardIds.StarlightWhelp:
		case CardIds.HexLordMalacrass:
			return (
				deckState.cardsInStartingHand
					?.map((c) => c.cardId ?? deckState.findCard(c.entityId)?.card?.cardId)
					.filter((c) => c !== cardId) ?? []
			);
		default:
			const dynamicCards = getDynamicRelatedCardIds(cardId, allCards.getService(), {
				format: metaData.formatType,
				gameType: metaData.gameType,
				currentClass: !deckState?.hero?.classes?.[0] ? '' : CardClass[deckState?.hero?.classes?.[0]],
				deckState: deckState,
				gameState: gameState,
				validArenaPool: validArenaPool,
			});
			if (hasOverride(dynamicCards)) {
				return (dynamicCards as { cards: readonly string[] }).cards;
			}
			return [...(dynamicCards ?? []), ...(existingRelatedCardIds ?? [])];
	}
};
