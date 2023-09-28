import { BoosterType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/user-packs';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Card, totalOwned } from '../../models/card';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';

export const deckDustCost = (
	cards: readonly { quantity: number; cardId: string }[],
	collection: readonly Card[],
	allCards: CardsFacadeService,
): number => {
	return cards
		.map((card) => {
			const owned = getOwnedForDeckBuilding(card.cardId, collection ?? [], allCards);
			const missingQuantity = Math.max(0, card.quantity - owned);
			const rarity = allCards.getCard(card.cardId)?.rarity;
			return dustToCraftFor(rarity) * missingQuantity;
		})
		.reduce((a, b) => a + b, 0);
};

export const getOwnedForDeckBuilding = (
	cardId: string,
	collection: readonly Card[],
	allCards: CardsFacadeService,
): number => {
	const allDuplicates: readonly string[] = getAllCardDuplicateIdsForDeckbuilding(cardId, allCards);
	return allDuplicates
		.map((id) => collection?.find((card) => card.id === id))
		.map((card) => totalOwned(card))
		.reduce((a, b) => a + b, 0);
};

const getAllCardDuplicateIdsForDeckbuilding = (cardId: string, allCards: CardsFacadeService): readonly string[] => {
	const allDuplicates = [cardId];
	const card = allCards.getCard(cardId);
	let duplicateDbfId = card.deckDuplicateDbfId;
	while (!!duplicateDbfId) {
		const duplicateCard = allCards.getCard(duplicateDbfId);
		allDuplicates.push(duplicateCard.id);
		duplicateDbfId = duplicateCard.deckDuplicateDbfId;
	}
	return allDuplicates.filter((c) => !!c);
};

export const dustFor = (rarity: string, cardType: CollectionCardType): number => {
	return cardType === 'NORMAL' ? dustForNormal(rarity) : dustForPremium(rarity);
};

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

const dustForPremium = (rarity: string): number => {
	return 4 * dustForNormal(rarity?.toLowerCase());
};

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

export const dustToCraftForPremium = (rarity: string): number => {
	return 4 * dustToCraftFor(rarity?.toLowerCase());
};

export const getPackDustValue = (pack: PackResult): number => {
	return pack.boosterId === BoosterType.MERCENARIES
		? pack.cards.map((card) => card.currencyAmount ?? 0).reduce((a, b) => a + b, 0)
		: pack.cards.map((card) => dustFor(card.cardRarity, card.cardType)).reduce((a, b) => a + b, 0);
};
