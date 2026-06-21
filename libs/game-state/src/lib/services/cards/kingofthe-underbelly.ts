/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Kingofthe Underbelly (JAIL_831)
 * While building your deck, pick 3 contraband Beasts. Battlecry: Discover one. It costs (3) less.
 */
import { CardClass, CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const beastDiscoverFilter = (
	c: Parameters<typeof hasCorrectType>[0],
	currentClass: Parameters<typeof canBeDiscoveredByClass>[1],
) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.BEAST) &&
	(!currentClass || !hasCorrectClass(c, CardClass[currentClass]));

export const KingoftheUnderbelly: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.KingoftheUnderbelly_JAIL_831 as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.KingoftheUnderbelly_JAIL_831 as unknown as CardIds,
			input.allCards,
			(c) => beastDiscoverFilter(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		races: [Race.BEAST],
		possibleCards: filterCards(
			TempCardIds.KingoftheUnderbelly_JAIL_831 as unknown as CardIds,
			input.allCards,
			(c) => beastDiscoverFilter(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
