/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectTribe } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Dr. Boom Mad Genius hero power - Delivery Drone: Discovers a Mech
export const DrBoomMadGeniusDeliveryDrone: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DrBoomMadGenius_DeliveryDrone],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DrBoomMadGeniusDeliveryDrone.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
			possibleCards: filterCards(
				DrBoomMadGeniusDeliveryDrone.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.MECH),
				input.options,
			),
		};
	},
};
