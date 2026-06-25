/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vicious Voidscale (JAIL_733)
 * Taunt. Deathrattle: Get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ViciousVoidscale: GeneratingCard = {
	cardIds: [CardIds.ViciousVoidscale_JAIL_733],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.VoidSoul_JAIL_732,
};
