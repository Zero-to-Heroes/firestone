/* eslint-disable no-mixed-spaces-and-tabs */
// Ironforge Portal (KAR_091 / CORE_WON_337 / WON_337): 4 Mana
// "Gain 4 Armor. Summon a random 4-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const IronforgePortal: StaticGeneratingCard = {
	cardIds: [CardIds.IronforgePortal, CardIds.IronforgePortal_CORE_WON_337, CardIds.IronforgePortal_WON_337],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(IronforgePortal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
