/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectTribe } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Dr. Boom Mad Genius hero power - Delivery Drone: Discovers a Mech
export const DrBoomMadGeniusDeliveryDrone: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DrBoomMadGenius_DeliveryDrone],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			DrBoomMadGeniusDeliveryDrone.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: filterCards(
				DrBoomMadGeniusDeliveryDrone.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
