/* eslint-disable no-mixed-spaces-and-tabs */
// Chaos Creation (DEEP_031): 6 Mana
// "Deal $6 damage. Summon a random 6-Cost minion. Destroy the bottom 6 cards of your deck."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const ChaosCreation: StaticGeneratingCard = {
	cardIds: [CardIds.ChaosCreation_DEEP_031],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ChaosCreation.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
