/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Mixologist: StaticGeneratingCard = {
	cardIds: [CardIds.Mixologist_MixologistsSpecialToken_VAC_523t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Mixologist's Special can be customized to Shadow Oil, which adds a random Demon
		return filterCards(
			Mixologist.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON),
			input.inputOptions,
		);
	},
};
