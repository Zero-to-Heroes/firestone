/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard } from './_card.type';

export const LeylineNexus: GeneratingCard = {
	cardIds: [TempCardIds.MageMend504LeylineNexus as unknown as CardIds],
	publicTutor: true,
	guessInfo: (): GuessedInfo | null => ({
		cardType: null,
		canBeAnyCardClassOrNeutral: true,
	}),
};
