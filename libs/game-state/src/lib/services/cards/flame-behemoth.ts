/* eslint-disable no-mixed-spaces-and-tabs */
// Flame Behemoth (TTN_716)
// Text: Battlecry: Get two random Magnetic Mechs. They cost (2) less.
// This card generates random Magnetic Mechs, so we need to show all possible Magnetic Mechs in the dynamic pool.

import { CardIds, CardType, GameTag, hasMechanic, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const FlameBehemoth: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FlameBehemoth],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			FlameBehemoth.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.MECH) &&
				hasMechanic(c, GameTag.MODULAR),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			mechanics: [GameTag.MODULAR],
			possibleCards: filterCards(
				FlameBehemoth.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.MECH) &&
					hasMechanic(c, GameTag.MODULAR),
				input.options,
			),
		};
	},
};
