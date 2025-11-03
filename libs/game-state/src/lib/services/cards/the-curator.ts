/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard } from './_card.type';

export const TheCurator: GeneratingCard = {
	cardIds: [CardIds.TheCurator_KAR_061, CardIds.TheCurator_CORE_KAR_061],
	hasSequenceInfo: true,
	publicTutor: true,
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
				cardType: CardType.MINION,
			};
		} else if (card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
			};
		} else if (card.createdIndex === 2) {
			return {
				cardType: CardType.MINION,
			};
		}
		return null;
	},
};
