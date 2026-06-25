/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Widows Bite (JAIL_436)
 * Give your hero +1 Attack this turn. Gain 1 Armor. Add "Widow's Feast" to your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const WidowsBite: GeneratingCard = {
	cardIds: [CardIds.WidowsBite_JAIL_436],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.WidowsFeast_JAIL_436t,
};
