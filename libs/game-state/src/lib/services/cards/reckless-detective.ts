/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Reckless Detective (JAIL_447)
 * Rush. Deathrattle: Get Detective's Clothes that give +4/+4 and Rush.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const RecklessDetective: GeneratingCard = {
	cardIds: [TempCardIds.RecklessDetective_JAIL_447 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.DetectivesClothes_JAIL_447t as unknown as CardIds,
};
