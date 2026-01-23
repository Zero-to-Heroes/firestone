/* eslint-disable no-mixed-spaces-and-tabs */
// Horn of Ancients (TSC_641tb)
// "Add a random <b>Colossal</b> minion to your hand. It costs (1)."
// The minion is added to hand (random, not discover), so it needs dynamicPool + guessInfo.

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const HornOfAncients: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HornOfAncients],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			HornOfAncients.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.COLOSSAL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			mechanics: [GameTag.COLOSSAL],
			cost: { cost: 1, comparison: '==' },
			possibleCards: filterCards(
				HornOfAncients.cardIds[0],
				input.allCards,
				(c) => hasMechanic(c, GameTag.COLOSSAL),
				input.options,
			),
		};
	},
};
