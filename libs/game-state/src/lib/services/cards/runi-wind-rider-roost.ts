/* eslint-disable no-mixed-spaces-and-tabs */
// Runi, Time Explorer - Wind Rider Roost (WON_053t2)
// Text: "Summon a random 3-Cost minion. Give it Charge"
// This card summons directly to the board, so it only needs StaticGeneratingCard for the pool display

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const RuniWindRiderRoost: StaticGeneratingCard = {
	cardIds: [CardIds.RuniTimeExplorer_WindRiderRoostToken_WON_053t2],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RuniWindRiderRoost.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3),
			input.inputOptions,
		);
	},
};
