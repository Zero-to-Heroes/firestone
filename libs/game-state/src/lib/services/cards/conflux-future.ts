/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const ConfluxFuture: GeneratingCard = {
	cardIds: [CardIds.PastConflux_FutureConfluxToken_TIME_436t2],
	publicCreator: true,
	guessCardId: (
		cardId: string,
		deckState: DeckState,
		opponentDeckState: DeckState,
		creatorCardId: string,
		creatorEntityId: number,
		createdIndex: number,
		allCards: CardsFacadeService,
	): string | null => {
		// We want to take the latest one, since it has just been created on board
		return (
			[...deckState.board]
				.sort((a, b) => b.entityId - a.entityId)
				.find((e) => e.creatorEntityId === creatorEntityId)?.cardId ?? null
		);
	},
};
