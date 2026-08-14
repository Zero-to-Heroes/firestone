/* eslint-disable no-mixed-spaces-and-tabs */
// Dangerous Variant (TIME_049): 2 Mana 1/1
// "At the start of your turn, transform into a random 5-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);

export const DangerousVariant: StaticGeneratingCard = {
	cardIds: [CardIds.DangerousVariant_TIME_049],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DangerousVariant.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
