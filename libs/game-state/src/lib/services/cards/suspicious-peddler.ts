/* eslint-disable no-mixed-spaces-and-tabs */
// Suspicious Peddler (NX2_044): 2 Mana 2/3 UNDEAD
// "[x]<b>Battlecry:</b> <b>Discover</b> a 1-Cost card. If your opponent guesses your choice, they get a copy."

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCost(c, '==', 1) && canBeDiscoveredByClass(c, currentClass);

export const SuspiciousPeddler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SuspiciousPeddler],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SuspiciousPeddler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SuspiciousPeddler.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cost: 1, possibleCards };
	},
};
