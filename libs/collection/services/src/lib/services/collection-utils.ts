import { BoosterType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { Card } from '@firestone/memory';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { totalOwned } from '../model/card-utils';
import { CollectionCardType } from '@firestone-hs/user-packs';

export const getOwnedForDeckBuilding = (
	cardId: string,
	collection: { [cardId: string]: Card },
	allCards: CardsFacadeService,
): number => {
	const allDuplicates: readonly string[] = getAllCardDuplicateIdsForDeckbuilding(cardId, allCards);
	return allDuplicates.map((id) => totalOwned(collection[id])).reduce((a, b) => a + b, 0);
};

const getAllCardDuplicateIdsForDeckbuilding = (cardId: string, allCards: CardsFacadeService): readonly string[] => {
	const allDuplicates = [cardId];
	const card = allCards.getCard(cardId);
	let duplicateDbfId = card.counterpartCards?.[0];
	while (!!duplicateDbfId) {
		const duplicateCard = allCards.getCard(duplicateDbfId);
		if (allDuplicates.includes(duplicateCard.id)) {
			break;
		}
		allDuplicates.push(duplicateCard.id);
		duplicateDbfId = duplicateCard.counterpartCards?.[0];
	}
	return allDuplicates.filter((c) => !!c);
};

export const dustFor = (rarity: string, cardType: CollectionCardType): number =>
	cardType === 'NORMAL' ? dustForNormal(rarity) : dustForPremium(rarity);

const dustForNormal = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 400;
		case 'epic':
			return 100;
		case 'rare':
			return 20;
		default:
			return 5;
	}
};

const dustForPremium = (rarity: string): number => 4 * dustForNormal(rarity?.toLowerCase());

export const dustToCraftFor = (rarity: string): number => {
	switch (rarity?.toLowerCase()) {
		case 'legendary':
			return 1600;
		case 'epic':
			return 400;
		case 'rare':
			return 100;
		default:
			return 40;
	}
};

export const dustToCraftForPremium = (rarity: string): number =>
	4 * dustToCraftFor(rarity?.toLowerCase());

export const getPackDustValue = (pack: PackResult): number =>
	pack.boosterId === BoosterType.MERCENARIES
		? pack.cards.map((card) => card.currencyAmount ?? 0).reduce((a, b) => a + b, 0)
		: pack.cards.map((card) => dustFor(card.cardRarity, card.cardType)).reduce((a, b) => a + b, 0);
