/* eslint-disable no-mixed-spaces-and-tabs */
// Ceremonial Clash (CATA_569): 4 Mana Shaman Spell
// "Summon a random 3, 2, and 1-Cost minion."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CeremonialClash: StaticGeneratingCard = {
	cardIds: [CardIds.CeremonialClash_CATA_569],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			CeremonialClash.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				(hasCost(c, '==', 1) || hasCost(c, '==', 2) || hasCost(c, '==', 3)),
			input.inputOptions,
		);
	},
};
