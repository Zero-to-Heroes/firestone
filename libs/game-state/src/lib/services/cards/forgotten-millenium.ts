/* eslint-disable no-mixed-spaces-and-tabs */
import { AllCardsService, CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Card, GeneratingCard, GuessInfoInput } from './_card.type';

export const ForgottenMillenium: Card & GeneratingCard = {
	cardIds: [CardIds.ForgottenMillennium_TIME_615],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			races: [Race.UNDEAD],
		};
	},
};
