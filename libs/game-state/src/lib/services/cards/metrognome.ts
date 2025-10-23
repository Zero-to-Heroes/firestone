/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard } from './_card.type';

export const Metrognome: GeneratingCard = {
	cardIds: [CardIds.Metrognome],
	guessInfo: (deckState: DeckState, allCards: CardsFacadeService, creatorEntityId: number): GuessedInfo | null => {
		const found = deckState.findCard(creatorEntityId);
		if (!found) {
			return null;
		}

		const { card } = found;
		const cost = card.tags[GameTag.TAG_SCRIPT_DATA_NUM_2];
		return cost != null
			? {
					cost: cost,
				}
			: null;
	},
};
