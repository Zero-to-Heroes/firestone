/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, CardType, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const TheEternalHold: GeneratingCard = {
	cardIds: [CardIds.TheEternalHold_TIME_446],
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	): GuessedInfo | null => {
		return {
			races: [Race.DEMON],
		};
	},
};
