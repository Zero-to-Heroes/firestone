/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasSpellSchool, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { filterCards } from './utils';

export const SunkenScroll: GeneratingCard = {
	cardIds: [CardIds.AzsharanScroll_SunkenScrollToken],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
			metadata?: Metadata;
			validArenaPool?: readonly string[];
		},
	): GuessedInfo | null => {
		if (card.createdIndex === 0) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FIRE) &&
						hasCorrectClass(c, deckState.hero?.classes?.[0] ?? null),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.FROST) &&
						hasCorrectClass(c, deckState.hero?.classes?.[0] ?? null),
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				possibleCards: filterCards(
					SunkenScroll.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.SPELL) &&
						hasSpellSchool(c, SpellSchool.NATURE) &&
						hasCorrectClass(c, deckState.hero?.classes?.[0] ?? null),
					options,
				),
			};
		}
		return null;
	},
};
