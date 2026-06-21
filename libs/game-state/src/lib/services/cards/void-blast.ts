/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Void Blast (JAIL_891)
 * Deal 3 damage to a minion. If it dies, get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const VoidBlast: GeneratingCard = {
	cardIds: [TempCardIds.VoidBlast_JAIL_891 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.VoidSoul_JAIL_732 as unknown as CardIds,
};
