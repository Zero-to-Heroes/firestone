/* eslint-disable no-mixed-spaces-and-tabs */
// Detailed Notes (GDB_844): 2 Mana
// "<b>Discover</b> a Beast that costs (5) or more. Reduce its Cost by (2)."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.BEAST) &&
	hasCost(c, '>=', 5) &&
	canBeDiscoveredByClass(c, currentClass);

export const DetailedNotes: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DetailedNotes_GDB_844],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			DetailedNotes.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DetailedNotes.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
