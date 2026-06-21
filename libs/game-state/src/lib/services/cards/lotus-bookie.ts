/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lotus Bookie (JAIL_720)
 * Deathrattle: Get a Coin.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const LotusBookie: GeneratingCard = {
	cardIds: [TempCardIds.LotusBookie_JAIL_720 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.TheCoinCore,
};
