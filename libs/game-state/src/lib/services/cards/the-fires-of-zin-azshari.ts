/* eslint-disable no-mixed-spaces-and-tabs */
// The Fires of Zin-Azshari (TSC_944): 2 Mana
// "Replace your deck with minions that cost (5) or more. They cost (5)."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5);

export const TheFiresOfZinAzshari: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TheFiresOfZinAzshari],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TheFiresOfZinAzshari.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TheFiresOfZinAzshari.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, possibleCards };
	},
};
