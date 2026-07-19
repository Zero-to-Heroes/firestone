/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const NelliesPirateShip: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.NellieTheGreatThresher, CardIds.NellieTheGreatThresher_NelliesPirateShipToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			NelliesPirateShip.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectTribe(c, Race.PIRATE) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			NelliesPirateShip.cardIds[0],
			input.allCards,
			(c) => hasCorrectTribe(c, Race.PIRATE) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			races: [Race.PIRATE],
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
