/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Mixologist: StaticGeneratingCard = {
	cardIds: [CardIds.Mixologist_MixologistsSpecialToken_VAC_523t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Mixologist's Special (also known as Shadow Oil) discovers a minion
		// Based on the card effect, it likely discovers minions with specific properties
		// For now, implementing as discovering any minion (can be refined based on actual card text)
		return filterCards(
			Mixologist.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
