import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Card {
	cardIds: readonly CardIds[];
}

// When drawing a card
export interface GeneratingCard extends Card {
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
		creatorEntityId: number,
		options?: {
			positionInHand?: number;
			tags?: readonly { Name: GameTag; Value: number }[];
		},
	) => GuessedInfo | null;
}
// When updating an existing card
// export interface UpdatingCard extends Card {
// 	updateGuessInfo: (
// 		deckState: DeckState,
// 		allCards: CardsFacadeService,
// 		creatorEntityId: number,
// 		options?: {
// 			positionInHand?: number;
// 			tags?: readonly { Name: GameTag; Value: number }[];
// 		},
// 	) => GuessedInfo | null;
// }
