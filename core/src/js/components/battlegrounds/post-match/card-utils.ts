import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

// Used to make the mapping between premium / normal minions
export const normalizeCardId = (cardId: string, allCards: AllCardsService) => {
	if (cardId.startsWith('TB_BaconUps_')) {
		const premiumCard = allCards.getCard(cardId);
		let normalCards = allCards
			.getCards()
			.filter((card) => card.type === 'Minion')
			.filter((card) => !card.id.startsWith('TB_BaconUps_'))
			.filter((card) => card.name === premiumCard.name)
			.filter((card) => card.set !== 'Wild_event')
			.filter((card) => card.set !== 'Tb');
		if (normalCards.length !== 1) {
			// When the card is reprinted for BGS
			const bgsOnly = normalCards.filter((card) => card.id.startsWith('BGS'));
			if (bgsOnly.length > 0) {
				normalCards = bgsOnly;
			}
		}
		if (normalCards.length !== 1) {
			if (cardId === CardIds.NonCollectible.Hunter.SavannahHighmane_HyenaTokenTavernBrawl) {
				normalCards = normalCards.filter(
					(card) => card.id === CardIds.NonCollectible.Hunter.SavannahHighmane_HyenaToken,
				);
			} else if (cardId === CardIds.NonCollectible.Hunter.RatPack_RatTokenTavernBrawl) {
				normalCards = normalCards.filter((card) => card.id === CardIds.NonCollectible.Hunter.RatPack_RatToken);
			} else if (cardId === CardIds.NonCollectible.Warlock.ImpGangBoss_ImpTokenTavernBrawl) {
				normalCards = normalCards.filter(
					(card) => card.id === CardIds.NonCollectible.Warlock.ImpGangBoss_ImpToken,
				);
			} else if (cardId === CardIds.NonCollectible.Mage.KhadgarTavernBrawl) {
				normalCards = normalCards.filter((card) => card.id === CardIds.Collectible.Mage.Khadgar);
			} else {
				console.warn('too many matches', cardId, normalCards);
			}
		}
		if (normalCards.length > 0) {
			return normalCards[0].id;
		}
	}
	return cardId;
};
