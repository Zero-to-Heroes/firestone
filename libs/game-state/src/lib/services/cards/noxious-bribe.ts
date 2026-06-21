/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Noxious Bribe (JAIL_861)
 * Discover a Choose One card. It has both effects combined. Give your opponent a plain copy.
 */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const chooseOneFilter = (c: Parameters<typeof hasCorrectType>[0], currentClass: string | undefined) =>
	hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, currentClass);

export const NoxiousBribe: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.NoxiousBribe_JAIL_861 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.NoxiousBribe_JAIL_861 as unknown as CardIds,
			input.allCards,
			(c) => chooseOneFilter(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		mechanics: [GameTag.CHOOSE_ONE],
		possibleCards: filterCards(
			TempCardIds.NoxiousBribe_JAIL_861 as unknown as CardIds,
			input.allCards,
			(c) => chooseOneFilter(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
