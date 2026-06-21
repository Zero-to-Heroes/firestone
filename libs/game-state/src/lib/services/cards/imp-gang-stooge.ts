/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Imp Gang Stooge (JAIL_399)
 * Taunt. Deathrattle: Put a 9/9 Demon with Taunt and Lifesteal on the bottom of your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ImpGangStooge: GeneratingCard = {
	cardIds: [TempCardIds.ImpGangStooge_JAIL_399 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.GrandmotherImp_JAIL_399t1 as unknown as CardIds,
};
