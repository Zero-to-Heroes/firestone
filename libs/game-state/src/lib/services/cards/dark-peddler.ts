/* eslint-disable no-mixed-spaces-and-tabs */
// Dark Peddler (LOE_023 / WON_096 / CORE_WON_096): 2 Mana Warlock minion
// "Battlecry: Discover a 1-Cost card."
// The card is discovered, so it needs the canBeDiscoveredByClass filter

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isOneCostCard = (card: ReferenceCard, currentClass: string | null | undefined) =>
	hasCost(card, '==', 1) && canBeDiscoveredByClass(card, currentClass ?? undefined);

export const DarkPeddler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DarkPeddler, CardIds.DarkPeddler_WON_096, CardIds.DarkPeddler_CORE_WON_096],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DarkPeddler.cardIds[0],
			input.allCards,
			(c) => isOneCostCard(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			possibleCards: filterCards(
				DarkPeddler.cardIds[0],
				input.allCards,
				(c) => isOneCostCard(c, currentClass),
				input.options,
			),
		};
	},
};
