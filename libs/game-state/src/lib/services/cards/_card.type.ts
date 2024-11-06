import { DeckState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Card {}

export interface GeneratingCard {
	getPossibleCardsReceivedInHand: (
		creatorCardId: string,
		deckState: DeckState,
		allCards: CardsFacadeService,
	) => readonly string[];
}
