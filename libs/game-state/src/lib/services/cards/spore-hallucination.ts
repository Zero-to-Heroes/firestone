/* eslint-disable no-mixed-spaces-and-tabs */
// Spore Hallucination (UNG_856): 1 Mana Rogue spell
// "Discover a card from your opponent's class."
// The card is discovered (generates a card in hand), so it needs guessInfo with canBeDiscoveredBy filter

import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SporeHallucination: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Hallucination],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const opponentClassStr = input.inputOptions.opponentDeckState.getCurrentClass();
		return filterCards(
			SporeHallucination.cardIds[0],
			input.allCards,
			(c) => canBeDiscoveredByClass(c, opponentClassStr),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentClassStr = input.opponentDeckState?.getCurrentClass();
		const possibleCards = filterCards(
			SporeHallucination.cardIds[0],
			input.allCards,
			(c) => canBeDiscoveredByClass(c, opponentClassStr),
			input.options,
		);
		const opponentClass = opponentClassStr ? CardClass[opponentClassStr.toUpperCase()] : undefined;
		return {
			cardClasses: opponentClass ? [opponentClass] : undefined,
			possibleCards: possibleCards,
		};
	},
};
