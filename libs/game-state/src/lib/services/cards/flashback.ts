/* eslint-disable no-mixed-spaces-and-tabs */
// Flashback (TIME_711): 2 Mana
// "Summon two random 1-Cost minions from the past. <b>Combo:</b> With +1 Attack."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);

export const Flashback: StaticGeneratingCard = {
	cardIds: [CardIds.Flashback_TIME_711],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(Flashback.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
