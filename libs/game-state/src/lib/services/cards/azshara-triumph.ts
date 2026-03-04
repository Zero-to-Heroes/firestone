/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AzsharasTriumph: StaticGeneratingCard = {
	cardIds: [CardIds.AzsharasTriumph_CATA_136],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			AzsharasTriumph.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 8),
			input.inputOptions,
		);
	},
};
