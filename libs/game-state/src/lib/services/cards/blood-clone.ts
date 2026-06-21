/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Blood Clone (JAIL_451)
 * Discover a 5-Cost minion. Spend 5 Corpses to summon a copy of it.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BloodClone: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.BloodClone_JAIL_451 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.BloodClone_JAIL_451 as unknown as CardIds,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 5) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		possibleCards: filterCards(
			TempCardIds.BloodClone_JAIL_451 as unknown as CardIds,
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', 5) &&
				canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
