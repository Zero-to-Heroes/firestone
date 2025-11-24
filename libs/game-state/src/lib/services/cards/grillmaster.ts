/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const Grillmaster: GeneratingCard = {
	cardIds: [CardIds.Grillmaster_VAC_917],
	hasSequenceInfo: true,
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return null;
	},
};
