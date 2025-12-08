/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Malkorok: StaticGeneratingCard = {
	cardIds: [CardIds.Malkorok_OG_220],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Malkorok.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.WEAPON),
			input.inputOptions,
		);
	},
};
