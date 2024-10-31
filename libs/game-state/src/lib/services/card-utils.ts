import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../models/deck-state';

export const getProcessedCard = (cardId: string, deckState: DeckState, allCards: CardsFacadeService): ReferenceCard => {
	const refCard: Mutable<ReferenceCard> = allCards.getCard(cardId);
	if (cardId?.startsWith(CardIds.ZilliaxDeluxe3000_TOY_330)) {
		const sideboard = deckState.sideboards?.find((s) => s.keyCardId === cardId);
		// Remove the cosmetic module
		const modules = sideboard?.cards?.map((c) => allCards.getCard(c)).filter((c) => c.health) ?? [];
		refCard.mechanics = refCard.mechanics ?? [];
		refCard.mechanics.push(...modules.flatMap((m) => m.mechanics ?? []));
		refCard.attack = modules.reduce((a, b) => a + (b.attack ?? 0), refCard.attack ?? 0);
		refCard.health = modules.reduce((a, b) => a + (b.health ?? 0), refCard.health ?? 0);
		refCard.cost = modules.reduce((a, b) => a + (b.cost ?? 0), refCard.cost ?? 0);
	}
	return refCard;
};
