/* eslint-disable no-mixed-spaces-and-tabs */
// Shimmer Shot (DEEP_003): 1 Mana
// "Deal $1 damage. Summon a random minion of that Cost."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);

export const ShimmerShot: StaticGeneratingCard = {
	cardIds: [CardIds.ShimmerShot_DEEP_003],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShimmerShot.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
