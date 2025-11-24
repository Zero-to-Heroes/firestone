/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const SunkenScroll: GeneratingCard = {
	cardIds: [CardIds.AzsharanScroll_SunkenScrollToken],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FIRE) &&
						hasCorrectClass(c, input.deckState.hero?.classes?.[0] ?? null),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FROST) &&
						hasCorrectClass(c, input.deckState.hero?.classes?.[0] ?? null),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.NATURE) &&
						hasCorrectClass(c, input.deckState.hero?.classes?.[0] ?? null),
					input.options,
				),
			};
		}
		return null;
	},
};
