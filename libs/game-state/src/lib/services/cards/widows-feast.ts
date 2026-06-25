/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Widows Feast (JAIL_436t)
 * Give your hero +2 Attack this turn. Gain 2 Armor. Add "Widow's Banquet" to your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const WidowsFeast: GeneratingCard = {
	cardIds: [CardIds.WidowsFeast_JAIL_436t],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.WidowsBanquet_JAIL_436t2,
};
