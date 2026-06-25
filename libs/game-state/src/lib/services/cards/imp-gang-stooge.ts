/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Imp Gang Stooge (JAIL_399)
 * Taunt. Deathrattle: Put a 9/9 Demon with Taunt and Lifesteal on the bottom of your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ImpGangStooge: GeneratingCard = {
	cardIds: [CardIds.ImpGangStooge_JAIL_399],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.GrandmotherImp_JAIL_399t1,
};
