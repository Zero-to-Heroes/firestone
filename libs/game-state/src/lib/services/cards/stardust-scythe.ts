/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Stardust Scythe (JAIL_730)
 * After your hero attacks, get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const StardustScythe: GeneratingCard = {
	cardIds: [CardIds.StardustScythe_JAIL_730],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.VoidSoul_JAIL_732,
};
