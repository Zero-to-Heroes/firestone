/* eslint-disable no-mixed-spaces-and-tabs */
// The Eternal Hold (TIME_446): 6 Mana Location
// "Discover any Demon that costs (5) or more. If your deck has no minions, your next one costs (1)."
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.DEMON) &&
	hasCost(c, '>=', 5) &&
	canBeDiscoveredByClass(c, currentClass);

export const TheEternalHold: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TheEternalHold_TIME_446],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TheEternalHold.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			races: [Race.DEMON],
			cost: { cost: 5, comparison: '>=' },
			possibleCards: filterCards(
				TheEternalHold.cardIds[0],
				input.allCards,
				(c) => isMatch(c, input.options.currentClass),
				input.options,
			),
		};
	},
};
