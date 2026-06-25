/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Spireof Solitude (JAIL_511)
 * Summon a Demon with stats equal to your hand size. It attacks a random enemy minion.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const SpireofSolitude: GeneratingCard = {
	cardIds: [CardIds.SpireofSolitude_JAIL_511],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.ShivarraInfiltrator_JAIL_511t,
};
