import { AllCardsService } from '@firestone-hs/replay-parser';

// Used to make the mapping between premium / normal minions
export const normalizeCardId = (cardId: string, allCards: AllCardsService) => {
	const refCard = allCards.getCard(cardId);
	if (refCard?.battlegroundsNormalDbfId) {
		const normalCard = allCards.getCardFromDbfId(refCard.battlegroundsNormalDbfId);
		return normalCard?.id;
	}
	return cardId;
};
