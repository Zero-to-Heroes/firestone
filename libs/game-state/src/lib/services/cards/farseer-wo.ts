/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AllCardsService,
	CardClass,
	CardIds,
	CardType,
	SpellSchool,
	hasSpellSchool,
} from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

function getFarseerWoPossibleCards(
	allCards: AllCardsService,
	options: GuessInfoInput['options'] | StaticGeneratingCardInput['inputOptions'],
	currentClass: string | undefined,
): readonly string[] {
	let result = filterCardsFromThePast(
		CardIds.FarseerWo_TIME_013,
		allCards,
		(c) =>
			hasCorrectType(c, CardType.SPELL) &&
			hasSpellSchool(c, SpellSchool.NATURE) &&
			canBeDiscoveredByClass(c, currentClass),
		options,
	);
	if (result.length === 0) {
		result = filterCardsFromThePast(
			CardIds.FarseerWo_TIME_013,
			allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasSpellSchool(c, SpellSchool.NATURE) &&
				canBeDiscoveredByClass(c, CardClass[CardClass.SHAMAN]),
			options,
		);
	}
	return result;
}

export const FarseerWo: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FarseerWo_TIME_013],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = getFarseerWoPossibleCards(
			input.allCards,
			input.options,
			input.deckState.getCurrentClass(),
		);
		return {
			cardType: CardType.SPELL,
			spellSchools: [SpellSchool.NATURE],
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const result = getFarseerWoPossibleCards(
			input.allCards,
			input.inputOptions,
			input.inputOptions.deckState.getCurrentClass(),
		);
		return result;
	},
};
