/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const DejaVu: GeneratingCard = {
	cardIds: [CardIds.DejaVu_TIME_039],
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
		const possibleCards =
			opponentDeckState.hand
				?.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index) ?? [];
		return {
			possibleCards: possibleCards,
		};
	},
};
