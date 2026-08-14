/* eslint-disable no-mixed-spaces-and-tabs */
// Firelands Portal (KAR_076 / CORE_KAR_076): 7 Mana
// "Deal $6 damage. Summon a random 6-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const FirelandsPortal: StaticGeneratingCard = {
	cardIds: [CardIds.FirelandsPortal, CardIds.FirelandsPortalCore],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FirelandsPortal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
