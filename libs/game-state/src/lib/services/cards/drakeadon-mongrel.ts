/* eslint-disable no-mixed-spaces-and-tabs */
// Drakeadon Mongrel (CATA_723): 7 Mana 8/6 Dragon
// "Deathrattle: Summon two random 4-Cost minions."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DrakeadonMongrel: StaticGeneratingCard = {
	cardIds: [CardIds.DrakeadonMongrel_CATA_723],
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DrakeadonMongrel.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
};
