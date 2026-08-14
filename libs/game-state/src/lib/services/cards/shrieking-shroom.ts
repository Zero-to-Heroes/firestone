/* eslint-disable no-mixed-spaces-and-tabs */
// Shrieking Shroom (LOOT_394): 3 Mana 1/2
// "At the end of your turn, summon a random 1-Cost minion."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const ShriekingShroom: StaticGeneratingCard = {
	cardIds: [CardIds.ShriekingShroom],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ShriekingShroom.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
