/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard } from './_card.type';

export const MurlocHolmes: GeneratingCard = {
	cardIds: [CardIds.MurlocHolmes_CORE_REV_022, CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770],
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
				possibleCards: opponentDeckState.cardsInStartingHand?.map((c) => c.cardId) ?? [],
			};
		} else if (card.createdIndex === 1) {
			return {
				possibleCards: opponentDeckState.hand?.map((c) => c.cardId) ?? [],
			};
		} else if (card.createdIndex === 2) {
			return {
				possibleCards: opponentDeckState.deck?.map((c) => c.cardId) ?? [],
			};
		}
		return null;
	},
};
