/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Breakout Architect (JAIL_123)
 * Battlecry: Discover a spell that costs (5) or more. It casts twice when played.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BreakoutArchitect: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.BreakoutArchitect_JAIL_123 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.BreakoutArchitect_JAIL_123 as unknown as CardIds,
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
			TempCardIds.BreakoutArchitect_JAIL_123 as unknown as CardIds,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
