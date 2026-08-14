/* eslint-disable no-mixed-spaces-and-tabs */
// Dethrone (TIME_712): 7 Mana
// "Destroy a minion. <b>Combo:</b> Summon a random 8-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const Dethrone: StaticGeneratingCard = {
	cardIds: [CardIds.Dethrone_TIME_712],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Dethrone.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
