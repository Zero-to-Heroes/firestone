/* eslint-disable no-mixed-spaces-and-tabs */
// Stormrook (TIME_217): 5 Mana 5/5 ELEMENTAL
// "[x]Whenever you would damage this with a Nature spell, summon a random 5-Cost minion instead."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5);

export const Stormrook: StaticGeneratingCard = {
	cardIds: [CardIds.Stormrook_TIME_217],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Stormrook.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
