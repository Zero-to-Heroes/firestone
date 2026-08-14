/* eslint-disable no-mixed-spaces-and-tabs */
// Final Frontier (GDB_857): 7 Mana
// "<b>Discover</b> a 10-Cost minion from the past. Set its Cost to (1)."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 10) && canBeDiscoveredByClass(c, currentClass);

export const FinalFrontier: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FinalFrontier_GDB_857],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(
			FinalFrontier.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(
			FinalFrontier.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, cost: 10, possibleCards };
	},
};
