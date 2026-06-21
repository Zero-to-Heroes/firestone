/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vicious Voidscale (JAIL_733)
 * Taunt. Deathrattle: Get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ViciousVoidscale: GeneratingCard = {
	cardIds: [TempCardIds.ViciousVoidscale_JAIL_733 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds,
};
