/* eslint-disable no-mixed-spaces-and-tabs */
// Unpopular Has-Been (ETC_349)
// 6-Cost 5/5 Undead Minion
// Deathrattle: Summon a random 5-Cost minion from the past.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

export const UnpopularHasBeen: StaticGeneratingCard = {
	cardIds: [CardIds.UnpopularHasBeen],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCardsFromThePast(
			UnpopularHasBeen.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5),
			input.inputOptions,
		);
	},
};
