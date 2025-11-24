/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const NeonInnovation: GeneratingCard = {
	cardIds: [CardIds.NeonInnovation_TIME_016],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.MECH],
		};
	},
};
