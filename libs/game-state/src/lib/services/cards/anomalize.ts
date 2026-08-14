/* eslint-disable no-mixed-spaces-and-tabs */
// Anomalize (TIME_859): 7 Mana
// "Summon a random 10 and 1-Cost minion. Scramble their stats."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 10);

export const Anomalize: StaticGeneratingCard = {
	cardIds: [CardIds.Anomalize_TIME_859],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Anomalize.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
