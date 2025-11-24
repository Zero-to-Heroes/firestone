/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const RingmasterWhatley: GeneratingCard = {
	cardIds: [CardIds.RingmasterWhatley],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.MINION,
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.MINION,
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.MINION,
			};
		}
		return null;
	},
};
