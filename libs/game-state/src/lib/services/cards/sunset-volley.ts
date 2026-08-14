/* eslint-disable no-mixed-spaces-and-tabs */
// Sunset Volley (WW_427): 9 Mana
// "Deal $10 damage randomly split among all enemies. Summon a random 10-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 10);

export const SunsetVolley: StaticGeneratingCard = {
	cardIds: [CardIds.SunsetVolley_WW_427],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SunsetVolley.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
