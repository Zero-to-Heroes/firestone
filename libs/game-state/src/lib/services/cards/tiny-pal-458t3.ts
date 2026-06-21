/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tiny Pal (JAIL_458t3)
 * After your hero attacks, summon a random 3-Cost minion. Give it Taunt. Choose another ammunition.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const TinyPal458t3: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.TinyPal_JAIL_458t3 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.TinyPal_JAIL_458t3 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 3, comparison: '==' },
		possibleCards: filterCards(
			TempCardIds.TinyPal_JAIL_458t3 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
};
