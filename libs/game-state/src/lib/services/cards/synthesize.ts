/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const Synthesize: GeneratingCard = {
	cardIds: [CardIds.Synthesize],
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
				cost: 1,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 1),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cost: 2,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 2),
					options,
				),
			};
		} else if (card.createdIndex === 2) {
			return {
				cost: 3,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 3),
					options,
				),
			};
		}
		return null;
	},
};
