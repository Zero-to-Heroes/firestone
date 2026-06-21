/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Underbelly Network (JAIL_877)
 * Summon a 2/1 Rat with Deathrattle: Draw a card.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const UnderbellyNetwork: GeneratingCard = {
	cardIds: [TempCardIds.UnderbellyNetwork_JAIL_877 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.SnootHoarder_JAIL_877t as unknown as CardIds,
};
