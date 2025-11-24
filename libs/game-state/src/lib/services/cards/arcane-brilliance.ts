/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const ArcaneBrilliance: GeneratingCard = {
	cardIds: [CardIds.ArcaneBrilliance],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
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
				cardType: CardType.SPELL,
				cost: 7,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 7),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				cost: 8,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 8),
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				cardType: CardType.SPELL,
				cost: 9,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 9),
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				cardType: CardType.SPELL,
				cost: 10,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 10),
					options,
				),
			};
		}
		return null;
	},
};
