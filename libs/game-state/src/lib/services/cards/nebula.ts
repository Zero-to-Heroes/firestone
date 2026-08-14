/* eslint-disable no-mixed-spaces-and-tabs */
// Nebula (GDB_479): 9 Mana
// "[x]<b>Discover</b> two 8-Cost minions to summon with <b>Taunt</b> and <b>Elusive</b>."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8) && canBeDiscoveredByClass(c, currentClass);

export const Nebula: StaticGeneratingCard = {
	cardIds: [CardIds.Nebula_GDB_479],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Nebula.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
};
