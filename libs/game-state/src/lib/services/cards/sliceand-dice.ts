/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Sliceand Dice (JAIL_500)
 * Replay all other cards played this turn (targeting enemies if possible). End your turn.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const SliceandDice: StaticGeneratingCard = {
	cardIds: [CardIds.SliceandDice_JAIL_500],
	dynamicPool: (input: StaticGeneratingCardInput) =>
		input.inputOptions.deckState.cardsPlayedThisTurn
			.map((c) => c.cardId)
			.filter((c) => c !== SliceandDice.cardIds[0]),
};
