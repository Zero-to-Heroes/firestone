import { Sideboard } from '@firestone-hs/deckstrings';
import { groupByFunction, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export interface MinimalCard {
	readonly cardId: string;
	readonly quantity: number;
	readonly sideboard?: readonly MinimalCard[];
}

export interface CardVariation extends MinimalCard {
	cardName: string;
	cardImage: string;
	isLegendary?: boolean;
	manaCost: number;
}

export const buildCardVariations = (
	cardIds: readonly string[],
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): readonly CardVariation[] => {
	const groupedByCard = groupByFunction((cardId: string) => cardId)(cardIds);
	return Object.keys(groupedByCard)
		.map((cardId) => buildCardVariation(cardId, groupedByCard[cardId].length, sideboards, allCards))
		.sort(sortByProperties((c) => [c.isLegendary ? 0 : 1, c.manaCost, c.cardName]));
};

export const buildCardVariation = (
	cardId: string,
	quantity: number,
	sideboards: readonly Sideboard[],
	allCards: CardsFacadeService,
): CardVariation => {
	const card = allCards.getCard(cardId);
	const sideboardCards = sideboards
		.find((s) => s.keyCardDbfId === card.dbfId)
		?.cards?.map((pair) => ({
			quantity: pair[1],
			card: allCards.getCard(pair[0]),
		}));
	return {
		cardId: card.id,
		cardImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card.id}.jpg`,
		quantity: quantity,
		isLegendary: card.rarity?.toLowerCase() === 'legendary',
		manaCost: card.cost ?? 0,
		cardName: card.name,
		sideboard: sideboardCards?.map((c) => buildCardVariation(c.card.id, c.quantity, [], allCards)),
	};
};
