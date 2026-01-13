/* eslint-disable no-mixed-spaces-and-tabs */
// Clash of the Colossals (TID_715)
// Text: Add a random Colossal minion to both players' hands. Yours costs (2) less.
// This card generates a random Colossal minion, so we need to show all possible Colossal minions in the dynamic pool.

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ClashOfTheColossals: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ClashOfTheColossals],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ClashOfTheColossals.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.COLOSSAL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			mechanics: [GameTag.COLOSSAL],
			possibleCards: filterCards(
				ClashOfTheColossals.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.COLOSSAL),
				input.options,
			),
		};
	},
};
