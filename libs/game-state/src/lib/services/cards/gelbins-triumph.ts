/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const GelbinsTriumph: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GelbinsTriumph_CATA_621],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			GelbinsTriumph.cardIds[0],
			input.allCards,
			(c) => c.mechanics?.includes('OBJECTIVE_AURA') ?? false,
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			GelbinsTriumph.cardIds[0],
			input.allCards,
			(c) => c.mechanics?.includes('OBJECTIVE_AURA') ?? false,
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
};
