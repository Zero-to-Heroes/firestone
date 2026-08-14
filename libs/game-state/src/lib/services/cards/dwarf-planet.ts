/* eslint-disable no-mixed-spaces-and-tabs */
// Dwarf Planet (GDB_233): 10 Mana
// "Fill your board with random 2-Cost minions that attack random enemies."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const DwarfPlanet: StaticGeneratingCard = {
	cardIds: [CardIds.DwarfPlanet_GDB_233],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DwarfPlanet.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
