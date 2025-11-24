/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const Metrognome: GeneratingCard = {
	cardIds: [CardIds.Metrognome],
	guessInfo: (
		card: DeckCard,
		deckState: DeckState,
		opponentDeckState: DeckState,
		allCards: AllCardsService,
		creatorEntityId: number,
	): GuessedInfo | null => {
		const found = deckState.findCard(creatorEntityId);
		if (!found) {
			return null;
		}

		const { card: creatorCard } = found;
		const cost = creatorCard.tags[GameTag.TAG_SCRIPT_DATA_NUM_2];
		return cost != null
			? {
					cost: cost,
				}
			: null;
	},
};
