/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HemetFoamMarksman: StaticGeneratingCard = {
	cardIds: [CardIds.HemetFoamMarksman_TOY_355],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			HemetFoamMarksman.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST),
			input.inputOptions,
		);
	},
};
