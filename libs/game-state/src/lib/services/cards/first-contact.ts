/* eslint-disable no-mixed-spaces-and-tabs */
// First Contact (GDB_864): 1 Mana
// "Summon two random 1-Cost minions. <b>Overload:</b> (1)"

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);

export const FirstContact: StaticGeneratingCard = {
	cardIds: [CardIds.FirstContact_GDB_864],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FirstContact.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
