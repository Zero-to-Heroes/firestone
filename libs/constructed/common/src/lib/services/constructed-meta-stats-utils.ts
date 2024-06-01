/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const overrideClassIcon = (
	deck: { format: string; heroCardIds?: readonly string[] },
	allCards: CardsFacadeService,
): string | null => {
	if (deck.format === 'twist') {
		const baseHeroCard = getTwistHeroCard(deck.heroCardIds, allCards);
		if (!!baseHeroCard) {
			return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${baseHeroCard.id}.jpg`;
		}
	}
	return null;
};

export const overrideDeckName = (
	deck: { format: string; heroCardIds?: readonly string[] },
	allCards: CardsFacadeService,
): string | null => {
	if (deck.format === 'twist') {
		const baseHeroCard = getTwistHeroCard(deck.heroCardIds, allCards);
		if (!!baseHeroCard) {
			return baseHeroCard.name;
		}
	}

	return null;
};

const getTwistHeroCard = (
	heroCardIds: readonly string[] | undefined,
	allCards: CardsFacadeService,
): ReferenceCard | null => {
	if (!heroCardIds?.length) {
		return null;
	}

	return heroCardIds
		.filter((cardId) => cardId?.startsWith('THD'))
		.map((c) => allCards.getCard(c))
		.sort((a, b) => a?.dbfId - b?.dbfId)[0];
};
