/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const VarianKingOfStormwind: GeneratingCard = {
	cardIds: [CardIds.VarianKingOfStormwind],
	hasSequenceInfo: true,
	publicTutor: true,
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
			return null;
		} else if (card.createdIndex === 1) {
			return null;
		} else if (card.createdIndex === 2) {
			return null;
		}
		return null;
	},
};
