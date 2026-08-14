/* eslint-disable no-mixed-spaces-and-tabs */
// Odd Map (TLC_824): 1 Mana
// "[x]<b>Discover</b> an odd-Attack Beast. If you play it this turn, also pick one of the others."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectTribe(c, Race.BEAST) &&
	(c?.attack ?? 0) % 2 === 1 &&
	canBeDiscoveredByClass(c, currentClass);

export const OddMap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.OddMap_TLC_824],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			OddMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			OddMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
