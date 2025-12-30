/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Razzle-Dazzler (VAC_301)
// "[x]<b>Battlecry:</b> Summon a random 5-Cost minion. Repeat for each spell school you've cast this game. <i>(0)</i>"
export const RazzleDazzler: StaticGeneratingCard = {
	cardIds: [CardIds.RazzleDazzler_VAC_301],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5),
			input.inputOptions,
		);
	},
};
