/* eslint-disable no-mixed-spaces-and-tabs */
// Travel Security (WORK_010): 6 Mana 2/2 UNDEAD
// "<b>Taunt</b>. <b>Deathrattle:</b> Summon a random 8-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const TravelSecurity: StaticGeneratingCard = {
	cardIds: [CardIds.TravelSecurity_WORK_010],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TravelSecurity.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
