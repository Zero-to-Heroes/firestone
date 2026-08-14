/* eslint-disable no-mixed-spaces-and-tabs */
// Containment Unit (TTN_700): 7 Mana 6/6 MECH
// "[x]<b>Magnetic</b> <b>Deathrattle:</b> Summon a random 8-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const ContainmentUnit: StaticGeneratingCard = {
	cardIds: [CardIds.ContainmentUnit],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ContainmentUnit.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
