/* eslint-disable no-mixed-spaces-and-tabs */
// Jackpot! (TID_931 / CORE_TID_931): 2 Mana Rogue Spell
// "Add 2 random spells from another class to your hand. They cost (5) or more."

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const ALL_PLAYABLE_CLASSES = [
	CardClass.DEATHKNIGHT,
	CardClass.DRUID,
	CardClass.HUNTER,
	CardClass.MAGE,
	CardClass.PALADIN,
	CardClass.PRIEST,
	CardClass.ROGUE,
	CardClass.SHAMAN,
	CardClass.WARLOCK,
	CardClass.WARRIOR,
	CardClass.DEMONHUNTER,
];

export const Jackpot: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Jackpot, CardIds.Jackpot_CORE_TID_931],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const currentClassEnum = currentClass ? CardClass[currentClass.toUpperCase() as keyof typeof CardClass] : null;
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
			cardClasses: ALL_PLAYABLE_CLASSES.filter((c) => c !== currentClassEnum),
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
