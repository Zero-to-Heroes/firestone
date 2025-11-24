/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const BargainBin: GeneratingCard = {
	cardIds: [CardIds.BargainBin_MIS_105],
	publicTutor: true,
	hasSequenceInfo: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return null;
	},
};
