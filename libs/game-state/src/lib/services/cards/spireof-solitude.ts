/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Spireof Solitude (JAIL_511)
 * Summon a Demon with stats equal to your hand size. It attacks a random enemy minion.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const SpireofSolitude: GeneratingCard = {
	cardIds: [TempCardIds.SpireofSolitude_JAIL_511 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.ShivarraInfiltrator_JAIL_511t as unknown as CardIds,
};
