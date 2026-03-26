/* eslint-disable no-mixed-spaces-and-tabs */
// Thistle Tea Set (TOY_514)
// 2-Cost Rogue Spell
// "Discover a spell from another class. Get a copy of it."
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { fromAnotherClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const ThistleTeaSet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ThistleTeaSet_TOY_514],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			ThistleTeaSet.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, currentClass),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ThistleTeaSet.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && fromAnotherClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
};
