/* eslint-disable no-mixed-spaces-and-tabs */
// Endtime Murozond (END_037): 9 Mana 4/6 Neutral Legendary minion
// "<b>Battlecry:</b> Fill your board with random Dragons. Fully heal your hero. Skip your next turn."
// Since it summons minions to the board (not adding to hand), only dynamicPool is needed

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EndtimeMurozond: StaticGeneratingCard = {
	cardIds: [CardIds.EndtimeMurozond_END_037],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			EndtimeMurozond.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON),
			input.inputOptions,
		);
	},
};
