/* eslint-disable no-mixed-spaces-and-tabs */
// Gravelsnout Knight (LOOT_154)
// 1-Cost 2/3 Neutral Minion
// Battlecry: Summon a random 1-Cost minion for your opponent.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const GravelsnoutKnight: StaticGeneratingCard = {
	cardIds: [CardIds.GravelsnoutKnight],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			GravelsnoutKnight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
