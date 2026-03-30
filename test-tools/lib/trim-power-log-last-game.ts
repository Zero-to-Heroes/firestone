/**
 * Utilities to isolate the last game from a Hearthstone power.log (may contain multiple matches).
 *
 * **Game start**
 * - Prefer the last `GameState.DebugPrintPower() - CREATE_GAME` line (canonical).
 * - If that stream is missing (some exports), use the last `PowerTaskList.DebugPrintPower()`
 *   line that contains `CREATE_GAME`.
 *
 * **No gaps:** everything from that opening `CREATE_GAME` through EOF is kept—no lines are
 * removed between there and the end of the fixture (including all GameState and PowerTaskList
 * lines in that range).
 */

/** @deprecated Use {@link findLastGameStartLineIndex} or {@link findCreateGameLineIndicesGameState}. */
export const POWER_LOG_CREATE_GAME_MARKER = 'GameState.DebugPrintPower() - CREATE_GAME';

/** Indices of lines that start a new game in the GameState stream. */
export function findCreateGameLineIndicesGameState(lines: readonly string[]): number[] {
	const indices: number[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (line.includes('GameState.DebugPrintPower()') && line.includes('CREATE_GAME')) {
			indices.push(i);
		}
	}
	return indices;
}

/** Indices of PowerTaskList CREATE_GAME lines (mirror of GameState game start). */
export function findCreateGameLineIndicesPowerTaskList(lines: readonly string[]): number[] {
	const indices: number[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (line.includes('PowerTaskList.DebugPrintPower()') && line.includes('CREATE_GAME')) {
			indices.push(i);
		}
	}
	return indices;
}

/**
 * @deprecated Prefer {@link findCreateGameLineIndicesGameState}. Same as
 * {@link findCreateGameLineIndicesGameState}.
 */
export function findCreateGameLineIndices(lines: readonly string[]): number[] {
	return findCreateGameLineIndicesGameState(lines);
}

/** Line index of the last game’s opening (GameState CREATE_GAME, else PowerTaskList CREATE_GAME). */
export function findLastGameStartLineIndex(lines: readonly string[]): number | null {
	const gs = findCreateGameLineIndicesGameState(lines);
	if (gs.length > 0) {
		return gs[gs.length - 1]!;
	}
	const ptl = findCreateGameLineIndicesPowerTaskList(lines);
	if (ptl.length > 0) {
		return ptl[ptl.length - 1]!;
	}
	return null;
}

/**
 * Keep only the last game: from the opening `CREATE_GAME` line through EOF, with no lines
 * omitted in between. Leading blank lines before that slice are dropped.
 */
export function trimPowerLogLinesToLastGame(lines: readonly string[]): string[] {
	const startIdx = findLastGameStartLineIndex(lines);
	if (startIdx == null) {
		return [...lines];
	}
	let out = lines.slice(startIdx);
	while (out.length && out[0]!.trim() === '') {
		out = out.slice(1);
	}
	return out;
}

export function trimPowerLogFileContentToLastGame(content: string): string[] {
	const lines = content.split(/\r?\n/);
	return trimPowerLogLinesToLastGame(lines);
}
