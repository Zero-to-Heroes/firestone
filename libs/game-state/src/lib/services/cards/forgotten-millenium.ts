/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const ForgottenMillenium: Card & GeneratingCard = {
	cardIds: [CardIds.ForgottenMillennium_TIME_615],
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	): GuessedInfo | null => {
		return {
			races: [Race.UNDEAD],
		};
	},
};
