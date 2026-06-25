/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Underbelly Network (JAIL_877)
 * Summon a 2/1 Rat with Deathrattle: Draw a card.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const UnderbellyNetwork: GeneratingCard = {
	cardIds: [CardIds.UnderbellyNetwork_JAIL_877],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.SnootHoarder_JAIL_877t,
};
