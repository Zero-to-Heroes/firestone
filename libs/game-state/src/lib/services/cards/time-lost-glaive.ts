/* eslint-disable no-mixed-spaces-and-tabs */
// Time-Lost Glaive (TIME_444): 1 Mana Weapon
// "Deathrattle: Get a random Demon from the past."
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectTribe(c, Race.DEMON);

export const TimeLostGlaive: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TimeLostGlaive_TIME_444],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(TimeLostGlaive.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DEMON],
			possibleCards: filterCardsFromThePast(TimeLostGlaive.cardIds[0], input.allCards, isMatch, input.options),
		};
	},
};
