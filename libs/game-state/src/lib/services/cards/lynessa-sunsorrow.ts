/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lynessa Sunsorrow (LOOT_216)
 * Battlecry: Cast each spell you cast on your minions this game on this one.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const LynessaSunsorrow: StaticGeneratingCard = {
	cardIds: [CardIds.LynessaSunsorrow],
	dynamicPool: (input: StaticGeneratingCardInput) =>
		input.inputOptions.deckState.spellsPlayedOnFriendlyMinions?.map((s) => s.cardId) ?? [],
};
