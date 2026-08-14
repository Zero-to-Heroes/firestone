/* eslint-disable no-mixed-spaces-and-tabs */
// First Day of School (SCH_247): 1 Mana
// "Add 2 random 1-Cost minions to your hand."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const FirstDayOfSchool: StaticGeneratingCard = {
	cardIds: [CardIds.FirstDayOfSchool],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(FirstDayOfSchool.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
