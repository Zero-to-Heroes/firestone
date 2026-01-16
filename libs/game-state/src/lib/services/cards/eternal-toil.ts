/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType, hasCost } from '../../..';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EternalToil: StaticGeneratingCard = {
	cardIds: [CardIds.EternalToil_END_020],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			EternalToil.cardIds[0],
			input.allCards,
			(c) => hasCost(c, '==', 1) && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		return possibleCards;
	},
};
