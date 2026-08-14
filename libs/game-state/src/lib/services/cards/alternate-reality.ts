/* eslint-disable no-mixed-spaces-and-tabs */
// Alternate Reality (TIME_707): 2 Mana
// "[x]Replace your hand and deck with random <b>Choose One</b> cards from the past. They cost (1) less."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.CHOOSE_ONE);

export const AlternateReality: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AlternateReality_TIME_707],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(AlternateReality.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(
			AlternateReality.cardIds[0],
			input.allCards,
			isMatch,
			input.options,
		);
		return { mechanics: [GameTag.CHOOSE_ONE], possibleCards };
	},
};
