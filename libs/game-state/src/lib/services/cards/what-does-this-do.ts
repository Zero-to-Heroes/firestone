/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WhatDoesThisDo: StaticGeneratingCard = {
	cardIds: [CardIds.TheAmazingReno_WhatDoesThisDoquestionHeroic],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WhatDoesThisDo.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
};
