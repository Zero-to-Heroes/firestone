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

export const PartnerAssignment: GeneratingCard = {
	cardIds: [CardIds.PartnerAssignment],
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
				cost: 2,
				races: [Race.BEAST],
				possibleCards: filterCards(
					PartnerAssignment.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 2),
					options,
				),
			};
		} else if (card.createdIndex === 1) {
			return {
				cost: 3,
				races: [Race.BEAST],
				possibleCards: filterCards(
					PartnerAssignment.cardIds[0],
					allCards,
					(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3),
					options,
				),
			};
		}
		return null;
	},
};
