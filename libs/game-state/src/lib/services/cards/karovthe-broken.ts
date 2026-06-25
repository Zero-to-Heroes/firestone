/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Karovthe Broken (JAIL_448)
 * Deathrattle: Get three 1/1 copies of random Legendary minions. They cost (1).
 */
import { CardIds, CardRarity, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const legendaryMinionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const KarovtheBroken: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.KarovtheBroken_JAIL_448],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.KarovtheBroken_JAIL_448,
			input.allCards,
			legendaryMinionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		rarity: CardRarity.LEGENDARY,
		possibleCards: filterCards(
			CardIds.KarovtheBroken_JAIL_448,
			input.allCards,
			legendaryMinionFilter,
			input.options,
		),
	}),
};
