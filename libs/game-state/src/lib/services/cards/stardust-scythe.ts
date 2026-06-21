/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Stardust Scythe (JAIL_730)
 * After your hero attacks, get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const StardustScythe: GeneratingCard = {
	cardIds: [TempCardIds.StardustScythe_JAIL_730 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds,
};
