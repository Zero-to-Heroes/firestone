/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Jumpscare: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Jumpscare_EDR_882],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Jumpscare.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.DEMON) &&
				hasCost(c, '>=', 5) &&
				canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DEMON],
			possibleCards: filterCards(
				Jumpscare.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.DEMON) &&
					hasCost(c, '>=', 5) &&
					canBeDiscoveredByClass(c, input.options.currentClass),
				input.options,
			),
		};
	},
};
