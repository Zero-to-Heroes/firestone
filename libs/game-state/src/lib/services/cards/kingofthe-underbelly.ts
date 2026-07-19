/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Kingofthe Underbelly (JAIL_831)
 * While building your deck, pick 3 contraband Beasts. Battlecry: Discover one. It costs (3) less.
 */
import { CardClass, CardIds, CardType, hasCorrectTribe, isArena, Race } from '@firestone-hs/reference-data';

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
	cardIds: [CardIds.KingoftheUnderbelly_JAIL_831],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		if (isArena(input.inputOptions.gameState.metadata.gameType)) {
			return [CardIds.Ursol_EDR_259, CardIds.TheGreatDracorex_DINO_401, CardIds.Tortolla_EDR_471];
		}
		return filterCards(
			CardIds.KingoftheUnderbelly_JAIL_831,
			input.allCards,
			(c) => beastDiscoverFilter(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		let possibleCards = filterCards(
			CardIds.KingoftheUnderbelly_JAIL_831,
			input.allCards,
			(c) => beastDiscoverFilter(c, input.deckState.getCurrentClass()),
			input.options,
		);
		if (isArena(input.gameState.metadata.gameType)) {
			possibleCards = [CardIds.Ursol_EDR_259, CardIds.TheGreatDracorex_DINO_401, CardIds.Tortolla_EDR_471];
		}
		return {
			cardType: CardType.MINION,
			races: [Race.BEAST],
			possibleCards: possibleCards,
		};
	},
};
