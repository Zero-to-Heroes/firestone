/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lotus Bookie (JAIL_720)
 * Deathrattle: Get a Coin.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const LotusBookie: GeneratingCard = {
	cardIds: [CardIds.LotusBookie_JAIL_720],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.TheCoinCore,
};
