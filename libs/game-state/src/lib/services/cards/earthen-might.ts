/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const EarthenMight: StaticGeneratingCard = {
	cardIds: [CardIds.EarthenMight],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			EarthenMight.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL),
			input.inputOptions,
		);
	},
};
