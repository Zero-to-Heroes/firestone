import { findLastGameStartLineIndex } from '../../lib/trim-power-log-last-game';

/**
 * Which {@link GameState.DebugPrintGame} `PlayerID` is the human (not `UNKNOWN HUMAN PLAYER`), from the
 * first such pair after the last `CREATE_GAME`. Falls back to the first id if both are unknown.
 */
export function extractLocalPlayerIdFromFirstDebugPrintGame(lines: readonly string[]): number {
	const start = findLastGameStartLineIndex(lines) ?? 0;
	const re = /GameState\.DebugPrintGame\(\) - PlayerID=(\d+), PlayerName=(.+)/;
	const found: { readonly id: number; readonly name: string }[] = [];
	for (let i = start; i < lines.length && found.length < 2; i++) {
		const m = re.exec(lines[i]!);
		if (m) {
			found.push({ id: parseInt(m[1]!, 10), name: m[2]!.trim() });
		}
	}
	const known = found.find((c) => c.name.length > 0 && !/^UNKNOWN/i.test(c.name));
	if (known) {
		return known.id;
	}
	return found[0]?.id ?? 1;
}

/**
 * Ground-truth hand size for the local player from {@link GameState.DebugPrintOptions} in a power.log
 * slice. Counts distinct entity ids for cards with `zone=HAND` and `player=<localPlayerId>` on
 * `mainEntity=[...]` lines in the **last** options block (the snapshot closest to EOF in the fixture).
 */
export function extractLocalPlayerHandCountFromLastDebugPrintOptions(
	lines: readonly string[],
	localPlayerId: number,
): number {
	let start = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		if (lines[i]?.includes('GameState.DebugPrintOptions() - id=')) {
			start = i;
			break;
		}
	}
	if (start < 0) {
		return 0;
	}
	const playerSuffix = `player=${localPlayerId}]`;
	const ids = new Set<number>();
	for (let i = start + 1; i < lines.length; i++) {
		const line = lines[i]!;
		if (!line.includes('GameState.DebugPrintOptions()')) {
			break;
		}
		if (!line.includes('mainEntity=[') || !line.includes('zone=HAND') || !line.includes(playerSuffix)) {
			continue;
		}
		const m = /\bid=(\d+)\s+zone=HAND\b/.exec(line);
		if (m) {
			ids.add(parseInt(m[1]!, 10));
		}
	}
	return ids.size;
}
