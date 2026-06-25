/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Reckless Detective (JAIL_447)
 * Rush. Deathrattle: Get Detective's Clothes that give +4/+4 and Rush.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const RecklessDetective: GeneratingCard = {
	cardIds: [CardIds.RecklessDetective_JAIL_447],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.DetectivesClothes_JAIL_447t,
};
