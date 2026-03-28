/**
 * Parse Torch (CATA_585) excess damage from power.log lines (TAG_SCRIPT_DATA_NUM_1 in SHOW_ENTITY).
 */

/**
 * Collect TAG_SCRIPT_DATA_NUM_1 values from SHOW_ENTITY blocks for Torch (fixture-specific).
 */
export function extractTorchScriptDataNum1ValuesFromPowerLogLines(lines: readonly string[]): number[] {
	const values: number[] = [];
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].includes('SHOW_ENTITY') || !lines[i].includes('CardID=CATA_585')) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
			const line = lines[j];
			if (line.includes('SHOW_ENTITY') && !line.includes('CATA_585')) {
				break;
			}
			const m = line.match(/tag=TAG_SCRIPT_DATA_NUM_1 value=(\d+)/);
			if (m) {
				values.push(parseInt(m[1], 10));
				break;
			}
		}
	}
	return values;
}
