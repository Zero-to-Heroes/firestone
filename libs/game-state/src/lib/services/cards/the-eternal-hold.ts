/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const TheEternalHold: GeneratingCard = {
	cardIds: [CardIds.TheEternalHold_TIME_446],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			races: [Race.DEMON],
			cost: { cost: 5, comparison: '>=' },
		};
	},
};
