/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const CaliaMenethil: StaticGeneratingCard = {
	cardIds: [CardIds.CaliaMenethil_CORE_CATA_002],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			CaliaMenethil.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
