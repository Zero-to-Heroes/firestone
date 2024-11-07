/* eslint-disable no-mixed-spaces-and-tabs */
import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const Metrognome: Card & GeneratingCard = {
	guessInfo: (deckState: DeckState, allCards: CardsFacadeService, creatorEntityId: number): GuessedInfo | null => {
		const found = deckState.findCard(creatorEntityId);
		if (!found) {
			return null;
		}

		const { card } = found;
		const cost = card.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value;
		return cost != null
			? {
					cost: cost,
			  }
			: null;
	},
};
