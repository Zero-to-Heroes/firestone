/**
 * Helpers for discover-zone-order power.log: Blood Draw (TIME_612) discover option order.
 *
 * Fixture `discover-zone-order.log` is truncated after `ChoiceCardMgr.WaitThenShowChoices() - id=4 BEGIN`
 * so replay stops with discover open (~3301 lines vs full last-game export).
 */

/** Card IDs for the three discover options after Blood Draw, in log order (Crypt Map first). */
export const BLOOD_DRAW_DISCOVER_CARD_IDS_FROM_FIXTURE: readonly string[] = [
	'TLC_435',
	'EDR_817',
	'ETC_424',
];

/**
 * Parse `GameState.DebugPrintEntityChoices()` block: lines after a Source= line matching `sourceMarker`.
 */
export function extractDiscoverCardIdsAfterChoicesSource(
	lines: readonly string[],
	sourceMarker: string,
): string[] {
	const result: string[] = [];
	let capturing = false;
	for (const line of lines) {
		if (
			!capturing &&
			line.includes('GameState.DebugPrintEntityChoices()') &&
			line.includes('Source=') &&
			line.includes(sourceMarker)
		) {
			capturing = true;
			continue;
		}
		if (capturing) {
			const m = /Entities\[\d+\]=.*cardId=(\S+)\s/.exec(line);
			if (m) {
				result.push(m[1]);
				continue;
			}
			if (result.length > 0) {
				break;
			}
		}
	}
	return result;
}

/**
 * Replay only through `WaitThenShowChoices() - id=… BEGIN` that follows the Blood Draw discover
 * `DebugPrintEntityChoices` block, so {@link GameState.playerDeck.currentOptions} stays populated.
 */
export function sliceLogThroughBloodDrawDiscoverWaitBegin(lines: readonly string[]): string[] {
	let sourceIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (
			line.includes('GameState.DebugPrintEntityChoices()') &&
			line.includes('Source=') &&
			line.includes('Blood Draw') &&
			line.includes('TIME_612')
		) {
			sourceIdx = i;
			break;
		}
	}
	if (sourceIdx < 0) {
		throw new Error('discover-zone-order: Blood Draw TIME_612 DebugPrintEntityChoices block not found');
	}
	for (let j = sourceIdx; j < lines.length; j++) {
		if (/WaitThenShowChoices\(\) - id=\d+ BEGIN/.test(lines[j]!)) {
			return lines.slice(0, j + 1);
		}
	}
	throw new Error('discover-zone-order: WaitThenShowChoices BEGIN after Blood Draw not found');
}
