/**
 * Helpers for {@link power-log-ysondre-replay.spec.ts} — values derived from the fixture, not guessed.
 */

/** Lines where opponent-side Ysondre (player=2 in log) moves to graveyard (death). */
export function countOpponentYsondreGraveyardTransitions(lines: readonly string[]): number {
	let n = 0;
	for (const line of lines) {
		if (
			line.includes('EDR_465') &&
			line.includes('player=2') &&
			line.includes('tag=ZONE value=GRAVEYARD')
		) {
			n++;
		}
	}
	return n;
}
