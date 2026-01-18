/* eslint-disable no-mixed-spaces-and-tabs */
// Infinite Amalgam (WON_143): 4 Mana 2/4 Neutral All type minion
// "[x]<b>Inspire, Frenzy, <b>Spellburst</b>,\nHonorable Kill, and Overkill:</b>\nSummon a random\n1-Cost minion."
// The minions are summoned, so only dynamicPool is needed (no guessInfo)

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const InfiniteAmalgam: StaticGeneratingCard = {
	cardIds: [CardIds.InfiniteAmalgam_WON_143],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			InfiniteAmalgam.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
