/**
 * Utilities to isolate the last game from a Hearthstone power.log (may contain multiple matches).
 * The usual rule: keep from the last "GameState ... CREATE_GAME" line through end of file.
 */

/** Line substring that marks the start of a new game in GameState power logs. */
export const POWER_LOG_CREATE_GAME_MARKER = 'GameState.DebugPrintPower() - CREATE_GAME';

/**
 * Return indices of lines that start a new game (last one is the start of the final game).
 */
export function findCreateGameLineIndices(lines: readonly string[]): number[] {
	const indices: number[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line.includes('GameState') && line.includes('CREATE_GAME')) {
			indices.push(i);
		}
	}
	return indices;
}

/**
 * Keep only the last game: from the last CREATE_GAME line to EOF (inclusive).
 */
export function trimPowerLogLinesToLastGame(lines: readonly string[]): string[] {
	const indices = findCreateGameLineIndices(lines);
	if (indices.length === 0) {
		return [...lines];
	}
	const start = indices[indices.length - 1];
	return lines.slice(start);
}

export function trimPowerLogFileContentToLastGame(content: string): string[] {
	const lines = content.split(/\r?\n/);
	return trimPowerLogLinesToLastGame(lines);
}
