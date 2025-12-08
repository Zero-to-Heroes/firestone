/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, sets, SetId } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ResortValet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ResortValet_VAC_432],
	publicCreator: true,
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
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const latestExpansion = sets[0];
		const validSets: readonly SetId[] = [latestExpansion.id, latestExpansion.miniSetFor].filter(
			(s): s is SetId => !!s,
		);
		return {
			possibleCards: filterCards(
				ResortValet.cardIds[0],
				input.allCards,
				(c) => !!c.set && validSets.some((s) => c.set?.toLowerCase() === s.toLowerCase()),
				input.options,
			),
		};
	},
};
