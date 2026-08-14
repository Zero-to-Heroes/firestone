/* eslint-disable no-mixed-spaces-and-tabs */
// Flight of the Bronze (RLK_917): 1 Mana
// "[x]<b>Discover</b> a Dragon. <b>Manathirst (7):</b> Summon a 5/5 Drake with <b>Taunt</b>."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && canBeDiscoveredByClass(c, currentClass);

export const FlightOfTheBronze: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FlightOfTheBronze],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			FlightOfTheBronze.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			FlightOfTheBronze.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
