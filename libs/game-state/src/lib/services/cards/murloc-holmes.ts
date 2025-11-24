/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const MurlocHolmes: GeneratingCard = {
	cardIds: [CardIds.MurlocHolmes_CORE_REV_022, CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				possibleCards: input.opponentDeckState.cardsInStartingHand?.map((c) => c.cardId) ?? [],
			};
		} else if (input.card.createdIndex === 1) {
			return {
				possibleCards: input.opponentDeckState.hand?.map((c) => c.cardId) ?? [],
			};
		} else if (input.card.createdIndex === 2) {
			return {
				possibleCards: input.opponentDeckState.deck?.map((c) => c.cardId) ?? [],
			};
		}
		return null;
	},
};
