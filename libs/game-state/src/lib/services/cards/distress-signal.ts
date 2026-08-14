/* eslint-disable no-mixed-spaces-and-tabs */
// Distress Signal (GDB_883): 4 Mana
// "[x]Summon two random 2-Cost minions. Refresh 2 Mana Crystals."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2);

export const DistressSignal: StaticGeneratingCard = {
	cardIds: [CardIds.DistressSignal_GDB_883],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(DistressSignal.cardIds[0], input.allCards, isMatch, input.inputOptions),
};
