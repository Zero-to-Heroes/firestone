/* eslint-disable no-mixed-spaces-and-tabs */
// Unknown Voyager (TIME_055): 5 Mana 4/5
// "After this survives damage, transform into a random 7-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 7);

export const UnknownVoyager: StaticGeneratingCard = {
	cardIds: [CardIds.UnknownVoyager_TIME_055],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(UnknownVoyager.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
