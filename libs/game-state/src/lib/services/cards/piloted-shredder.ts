/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const PilotedShredder: StaticGeneratingCard = {
	cardIds: [CardIds.PilotedShredder_GVG_096],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			PilotedShredder.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCost(c, '==', 2),
			input.inputOptions,
		);
	},
};
