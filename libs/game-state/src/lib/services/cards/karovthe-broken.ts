/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Karovthe Broken (JAIL_448)
 * Deathrattle: Get three 1/1 copies of random Legendary minions. They cost (1).
 */
import { CardIds, CardRarity, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const legendaryMinionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const KarovtheBroken: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.KarovtheBroken_JAIL_448 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.KarovtheBroken_JAIL_448 as unknown as CardIds,
			input.allCards,
			legendaryMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		rarity: CardRarity.LEGENDARY,
		possibleCards: filterCards(
			TempCardIds.KarovtheBroken_JAIL_448 as unknown as CardIds,
			input.allCards,
			legendaryMinionFilter,
			input.options,
		),
	}),
};
