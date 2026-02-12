import { CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const isBgsTrinket = (card: ReferenceCard): boolean => {
	return card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET];
};

export const isBgsSpell = (card: ReferenceCard): boolean => {
	return card.type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL];
};

export const isBgsTimewarped = (card: ReferenceCard): boolean => {
	return card.mechanics?.includes(GameTag[GameTag.BACON_TIMEWARPED]);
};

export const buildAllCardIds = (
	id: string,
	showGoldenCards: boolean,
	allCards: CardsFacadeService,
	reverse = false,
): string => {
	if (!showGoldenCards) {
		return id;
	}

	const premiumId = allCards.getCard(id).battlegroundsPremiumDbfId;
	if (!premiumId) {
		return id;
	}

	const premiumCard = allCards.getCardFromDbfId(premiumId);
	if (!premiumCard?.id) {
		return id;
	}

	if (!reverse) {
		return [id, `${premiumCard.id}_golden`].join(',');
	} else {
		return [`${premiumCard.id}_golden`, id].join(',');
	}
};

export const buildRelatedCardIds = (id: string, allCards: CardsFacadeService): readonly string[] => {
	const refCard = allCards.getCard(id);
	return refCard.relatedCardDbfIds?.map((dbfId) => allCards.getCardFromDbfId(dbfId)?.id) ?? [];
};
