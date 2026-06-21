/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Emergency Surgery (JAIL_454)
 * Choose an enemy minion. Summon three 3/1 Undead with Lifesteal that attack it.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const EmergencySurgery: GeneratingCard = {
	cardIds: [TempCardIds.EmergencySurgery_JAIL_454 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.Necronurse_JAIL_454t as unknown as CardIds,
};
