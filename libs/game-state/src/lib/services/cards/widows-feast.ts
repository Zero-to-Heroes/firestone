/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Widows Feast (JAIL_436t)
 * Give your hero +2 Attack this turn. Gain 2 Armor. Add "Widow's Banquet" to your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const WidowsFeast: GeneratingCard = {
	cardIds: [TempCardIds.WidowsFeast_JAIL_436t as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.WidowsBanquet_JAIL_436t2 as unknown as CardIds,
};
