/* eslint-disable no-mixed-spaces-and-tabs */
// Maelstrom Portal (CORE_KAR_073): 2 Mana
// "Deal $1 damage to all enemy minions. Summon a random 1-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const MaelstromPortal: StaticGeneratingCard = {
	cardIds: [CardIds.MaelstromPortal_CORE_KAR_073],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MaelstromPortal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
