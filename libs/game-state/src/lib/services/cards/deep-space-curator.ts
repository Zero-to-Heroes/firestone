/* eslint-disable no-mixed-spaces-and-tabs */
import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const DeepSpaceCurator: Card & GeneratingCard = {
	guessInfo: (
		deckState: DeckState,
		allCards: CardsFacadeService,
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
