/* eslint-disable no-mixed-spaces-and-tabs */
// Jar Dealer: 3 Mana 1/4 Warlock minion
// Battlecry: Summon a random 1-Cost minion.
// The minion is summoned directly, so it draws from the pool of 1-cost minions

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const JarDealer: StaticGeneratingCard = {
	cardIds: [CardIds.JarDealer],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			JarDealer.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
