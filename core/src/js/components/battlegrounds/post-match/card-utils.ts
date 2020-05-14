import { AllCardsService } from '@firestone-hs/replay-parser';

// Used to make the mapping between premium / normal minions
export const normalizeCardId = (cardId: string, allCards: AllCardsService) => {
	if (cardId.startsWith('TB_BaconUps_')) {
		const premiumCard = allCards.getCard(cardId);
		let normalCards = allCards
			.getCards()
			.filter(card => card.type === 'Minion')
			.filter(card => !card.id.startsWith('TB_BaconUps_'))
			.filter(card => card.name === premiumCard.name);
		if (normalCards.length !== 1) {
			// When the card is reprinted for BGS
			const bgsOnly = normalCards
				.filter(card => card.id.startsWith('BGS'))
				.filter(card => card.set !== 'Wild_event');
			if (bgsOnly.length > 0) {
				normalCards = bgsOnly;
			}
		}
		if (normalCards.length !== 1) {
			console.warn('too many matches', cardId, normalCards);
		}
		if (normalCards.length > 0) {
			return normalCards[0].id;
		}
	}
	return cardId;
};
