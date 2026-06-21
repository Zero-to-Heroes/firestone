/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * The Skeleton Key (JAIL_319)
 * Discover a spell, or refresh your options (20% chance to take 5 damage each refresh!)
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheSkeletonKey: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.TheSkeletonKey_JAIL_319 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TempCardIds.TheSkeletonKey_JAIL_319 as unknown as CardIds, input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: filterCards(TempCardIds.TheSkeletonKey_JAIL_319 as unknown as CardIds, input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
