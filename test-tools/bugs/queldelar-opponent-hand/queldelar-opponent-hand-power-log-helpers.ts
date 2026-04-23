import { DeckCard, DeckState, GameState } from '@firestone/game-state';

/**
 * Helpers for {@link ./power-log-queldelar-replay.spec.ts}.
 * Leaked id is read from opponent `SHOW_ENTITY` ... `zone=HAND` ... `player=2` ... `CardID=...`.
 */
export function extractOpponentHandQueldelarCardIdFromPowerLogLines(lines: readonly string[]): string | null {
	for (const line of lines) {
		if (
			!line.includes('SHOW_ENTITY') ||
			!line.includes('zone=HAND') ||
			!line.includes('player=2') ||
			!line.includes('CardID=')
		) {
			continue;
		}
		const m = /CardID=([A-Za-z0-9_]+)/.exec(line);
		if (m?.[1]) {
			return m[1]!;
		}
	}
	return null;
}

/**
 * Forged Quel'Delar (entity 178) may briefly have `zone: null` while still attributed to the opponent.
 * Prefer the aggregated replay snapshot so we do not miss intermediate placements.
 */
function collectAllDeckCardsForReplay(state: GameState): readonly DeckCard[] {
	const z = (d: DeckState) => [
		...d.hand,
		...d.deck,
		...d.board,
		...d.otherZone,
		...d.deckList,
	];
	return [...z(state.playerDeck), ...z(state.opponentDeck)];
}

export function findQueldelarEntityCardInReplay(state: GameState, entityId: number = 178): DeckCard | undefined {
	return collectAllDeckCardsForReplay(state).find((c) => c.entityId === entityId);
}
