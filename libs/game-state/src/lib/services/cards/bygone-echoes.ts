/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BygoneEchoes: StaticGeneratingCard = {
	cardIds: [CardIds.BygoneEchoes_END_005],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BygoneEchoes.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
};
