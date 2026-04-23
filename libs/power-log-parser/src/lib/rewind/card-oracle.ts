/**
 * Minimal reference-data surface the rewind machinery needs.
 *
 * The parser-side RewindController uses this to decide, on a root-level BLOCK_START, whether
 * the origin entity's card statically carries the REWIND mechanic. Any object exposing a
 * structural `getCard(id)` that returns `{ mechanics?: string[] }` satisfies it (both
 * `AllCardsService` from `@firestone-hs/reference-data` and the app's `CardsFacadeService`).
 *
 * This stays small on purpose - we don't want the parser to take a transitive dep on the
 * whole cards facade stack, and callers that don't need rewind support can pass `null`.
 */
export interface RewindCardOracle {
	/**
	 * True iff the card identified by `cardId` has the REWIND mechanic statically declared
	 * in reference data. Implementations must handle empty / unknown `cardId` by returning
	 * false (do not throw) - the parser calls this with unresolved opponent cardIds.
	 */
	hasRewindMechanic(cardId: string | null | undefined): boolean;
}

/** The 'REWIND' mechanic tag as it appears in `cards_short.json`. */
export const REWIND_MECHANIC_NAME = 'REWIND';

type CardsSource = {
	getCard(id: string | number): { mechanics?: string[] | null } | null | undefined;
};

/**
 * Build a {@link RewindCardOracle} backed by any object that exposes a
 * `getCard(id): { mechanics?: string[] }` method - e.g. `AllCardsService` from
 * `@firestone-hs/reference-data` or the app's `CardsFacadeService`.
 */
export function buildRewindCardOracle(cards: CardsSource | null | undefined): RewindCardOracle {
	return {
		hasRewindMechanic(cardId: string | null | undefined): boolean {
			if (cards == null) return false;
			if (cardId == null || cardId.length === 0) return false;
			try {
				const card = cards.getCard(cardId);
				return !!card?.mechanics?.includes(REWIND_MECHANIC_NAME);
			} catch {
				return false;
			}
		},
	};
}
