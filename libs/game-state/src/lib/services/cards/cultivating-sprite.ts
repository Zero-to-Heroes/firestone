/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard } from './_card.type';

export const CultivatingSprite: GeneratingCard = {
	cardIds: [TempCardIds.NeutralMend100CultivatingSprite as unknown as CardIds],
	publicCreator: true,
	guessInfo: (): GuessedInfo | null => ({
		possibleCards: [TempCardIds.NeutralMend100tBloomingBulb],
	}),
};
