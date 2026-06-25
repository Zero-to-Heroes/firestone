/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Void Blast (JAIL_891)
 * Deal 3 damage to a minion. If it dies, get a Void Soul.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const VoidBlast: GeneratingCard = {
	cardIds: [CardIds.VoidBlast_JAIL_891],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.VoidSoul_JAIL_732,
};
