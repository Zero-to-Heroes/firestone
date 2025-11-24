/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardRarity, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const DejaVu: GeneratingCard = {
	cardIds: [CardIds.DejaVu_TIME_039],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards =
			input.opponentDeckState.hand
				?.map((c) => c.cardId)
				.filter((c) => !!c)
				.filter((c, index, self) => self.indexOf(c) === index) ?? [];
		return {
			possibleCards: possibleCards,
		};
	},
};
