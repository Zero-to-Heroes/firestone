/* eslint-disable no-mixed-spaces-and-tabs */
// Jackpot! (TID_931 / CORE_TID_931): 2 Mana Rogue Spell
// "Add 2 random spells from another class to your hand. They cost (5) or more."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Jackpot: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Jackpot, CardIds.Jackpot_CORE_TID_931],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			Jackpot.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 5) &&
				fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			cost: { cost: 5, comparison: '>=' },
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Jackpot.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasCost(c, '>=', 5) &&
				fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
