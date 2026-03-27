/* eslint-disable no-mixed-spaces-and-tabs */
// Tooth of Nefarian (ONY_032)
// 2-Cost Rogue Common Spell
// "Deal 3 damage. Honorable Kill: Discover a spell from another class."
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ToothOfNefarian: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ToothOfNefarian],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		return filterCards(
			ToothOfNefarian.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			ToothOfNefarian.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
};
