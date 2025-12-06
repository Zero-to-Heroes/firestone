/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCost } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const PilotedSkyGolem: StaticGeneratingCard = {
	cardIds: [CardIds.PilotedSkyGolem_GVG_105],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			PilotedSkyGolem.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
};
