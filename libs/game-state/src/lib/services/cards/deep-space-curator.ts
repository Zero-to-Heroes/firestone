/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';

export const DeepSpaceCurator: GeneratingCard = {
	cardIds: [CardIds.DeepSpaceCurator_GDB_311],
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
		const cost = options?.tags?.find((tag) => tag.Name === GameTag.COST)?.Value;
		return cost != null
			? {
					cost: cost,
				}
			: null;
	},
};
