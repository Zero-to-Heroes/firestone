/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const IntertwinedFate: GeneratingCard = {
	cardIds: [CardIds.IntertwinedFate_TIME_432],
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
		},
	): GuessedInfo | null => {
		let possibleCards: readonly string[] = [];
		if (card.createdIndex === 0) {
			possibleCards = deckState.deck
				.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index);
		} else if (card.createdIndex === 1) {
			possibleCards = opponentDeckState.deck
				.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index);
		}
		return {
			possibleCards: possibleCards,
		};
	},
};
