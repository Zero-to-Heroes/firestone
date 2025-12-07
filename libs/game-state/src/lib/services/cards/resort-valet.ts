/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, sets, SetId } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ResortValet: StaticGeneratingCard = {
	cardIds: [CardIds.ResortValet_VAC_432],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const latestExpansion = sets[0];
		const validSets: readonly SetId[] = [latestExpansion.id, latestExpansion.miniSetFor].filter(
			(s): s is SetId => !!s,
		);
		return filterCards(
			ResortValet.cardIds[0],
			input.allCards,
			(c) => !!c.set && validSets.some((s) => c.set?.toLowerCase() === s.toLowerCase()),
			input.inputOptions,
		);
	},
};
