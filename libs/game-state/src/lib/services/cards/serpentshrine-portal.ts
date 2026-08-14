/* eslint-disable no-mixed-spaces-and-tabs */
// Serpentshrine Portal (BT_100): 3 Mana
// "Deal $3 damage. Summon a random 3-Cost minion. <b>Overload:</b> (1)"

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const SerpentshrinePortal: StaticGeneratingCard = {
	cardIds: [CardIds.SerpentshrinePortal_BT_100],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SerpentshrinePortal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
