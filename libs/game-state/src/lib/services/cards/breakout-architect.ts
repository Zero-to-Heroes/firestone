/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Breakout Architect (JAIL_123)
 * Battlecry: Discover a spell that costs (5) or more. It casts twice when played.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BreakoutArchitect: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BreakoutArchitect_JAIL_123],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.BreakoutArchitect_JAIL_123,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		cost: { cost: 5, comparison: '>=' },
		possibleCards: filterCards(
			CardIds.BreakoutArchitect_JAIL_123,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
