import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
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
// Wait until this is correctly refactored
// export interface SelectorCard extends Card {
// 	selector: (info: HighlightSide) => Selector;
// }
