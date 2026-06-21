/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Widows Bite (JAIL_436)
 * Give your hero +1 Attack this turn. Gain 1 Armor. Add "Widow's Feast" to your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const WidowsBite: GeneratingCard = {
	cardIds: [TempCardIds.WidowsBite_JAIL_436 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.WidowsFeast_JAIL_436t as unknown as CardIds,
};
