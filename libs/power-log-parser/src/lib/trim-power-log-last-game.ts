/**
 * Utilities to isolate the last game from a Hearthstone power.log (may contain multiple matches).
 *
 * **Game start**
 * - Prefer the last `GameState.DebugPrintPower() - CREATE_GAME` line (canonical).
 * - If that stream is missing (some exports), use the last `PowerTaskList.DebugPrintPower()`
 *   line that contains `CREATE_GAME`.
 *
 * **No gaps:** everything from that opening `CREATE_GAME` through EOF is kept—no lines are
 * omitted in between there and the end of the fixture (including all GameState and PowerTaskList
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

/** GameState lines that mark the end of a game (normal completion or a concede). */
function isGameCompletionLine(line: string): boolean {
	return (
		line.includes('GameState.DebugPrintPower()') &&
		(line.includes('tag=STATE value=COMPLETE') || line.includes('tag=PLAYSTATE value=CONCEDED'))
	);
}

/**
 * Keep only the last *completed* game: the slice from its opening `CREATE_GAME` line up to
 * (but excluding) the next game's `CREATE_GAME`, or EOF.
 *
 * This is the right trim for end-of-game uploads reading the on-disk Power.log: the file
 * accumulates every game of the session, and by the time the upload runs (worker-side metadata
 * build takes tens of seconds) a new game may already have started — `trimPowerLogLinesToLastGame`
 * would then return the wrong (new, unfinished) game. Falls back to the plain last-game trim
 * when no completion marker exists (e.g. HS closed mid-game).
 */
export function trimPowerLogLinesToLastCompletedGame(lines: readonly string[]): string[] {
	let lastCompleteIdx = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		if (isGameCompletionLine(lines[i]!)) {
			lastCompleteIdx = i;
			break;
		}
	}
	if (lastCompleteIdx < 0) {
		return trimPowerLogLinesToLastGame(lines);
	}
	const starts = findCreateGameLineIndicesGameState(lines);
	let startIdx: number | null = null;
	let nextStartIdx: number | null = null;
	for (const idx of starts) {
		if (idx <= lastCompleteIdx) {
			startIdx = idx;
		} else {
			nextStartIdx = idx;
			break;
		}
	}
	if (startIdx == null) {
		return trimPowerLogLinesToLastGame(lines);
	}
	let out = nextStartIdx != null ? lines.slice(startIdx, nextStartIdx) : lines.slice(startIdx);
	while (out.length && out[0]!.trim() === '') {
		out = out.slice(1);
	}
	return out;
}
