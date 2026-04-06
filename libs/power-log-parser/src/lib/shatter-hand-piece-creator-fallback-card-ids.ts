import { CardIds } from '@firestone-hs/reference-data';

/**
 * Spells that may appear in the graveyard as the resolved “source” when SHATTERED hand pieces omit
 * CREATOR / DISPLAYED_CREATOR (see `Oracle.FindShatteredPieceCreatorFromGraveyard` in oracle.ts).
 * Game-state receive-in-hand uses the same list when inferring creator from `cardsPlayedThisMatch`.
 * Re-exported from game-state `hs-utils` for app callers.
 */
export const SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS: readonly CardIds[] = [
	CardIds.SparkOfLife_EDR_872,
	CardIds.SandsOfTime_TIME_EVENT_999,
];
