/**
 * Parse Bottled Shadeleaf (WW_393t) TAG_SCRIPT_DATA_NUM_1 per entity from power.log lines.
 * The game sets distinct script values for each token created from one Invasive Shadeleaf cast.
 */
export function extractBottledShadeleafScriptDataNum1ByEntityId(
	lines: readonly string[],
): Map<number, number> {
	const map = new Map<number, number>();
	const re =
		/Bottled Shadeleaf id=(\d+)[^\]]*\][^\n]*tag=TAG_SCRIPT_DATA_NUM_1 value=(\d+)/;
	for (const line of lines) {
		if (!line.includes('Bottled Shadeleaf') || !line.includes('TAG_SCRIPT_DATA_NUM_1')) {
			continue;
		}
		const m = line.match(re);
		if (m) {
			map.set(parseInt(m[1], 10), parseInt(m[2], 10));
		}
	}
	return map;
}
