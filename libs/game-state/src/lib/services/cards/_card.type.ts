import { GameTag } from '@firestone-hs/reference-data';
import { DeckState, GuessedInfo } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Card {}

export interface GeneratingCard {
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	) => GuessedInfo | null;
}
