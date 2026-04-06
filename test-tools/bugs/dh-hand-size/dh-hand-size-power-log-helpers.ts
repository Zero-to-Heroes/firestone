/**
 * Ground-truth hand size for the local player from {@link GameState.DebugPrintOptions} in a power.log
 * slice. Counts distinct entity ids for cards with `zone=HAND` and `player=1` on `mainEntity=[...]`
 * lines in the **last** options block (the snapshot closest to EOF in the fixture).
 */
export function extractLocalPlayerHandCountFromLastDebugPrintOptions(lines: readonly string[]): number {
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
	const ids = new Set<number>();
	for (let i = start + 1; i < lines.length; i++) {
		const line = lines[i]!;
		if (!line.includes('GameState.DebugPrintOptions()')) {
			break;
		}
		if (!line.includes('mainEntity=[') || !line.includes('zone=HAND') || !line.includes('player=1]')) {
			continue;
		}
		const m = /\bid=(\d+)\s+zone=HAND\b/.exec(line);
		if (m) {
			ids.add(parseInt(m[1]!, 10));
		}
	}
	return ids.size;
}
