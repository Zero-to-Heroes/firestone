/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ConfrontTheTolvir: StaticGeneratingCard = {
	cardIds: [CardIds.ConfrontTheTolvir_CATA_560],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ConfrontTheTolvir.cardIds[0],
			input.allCards,
			(c) => hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
