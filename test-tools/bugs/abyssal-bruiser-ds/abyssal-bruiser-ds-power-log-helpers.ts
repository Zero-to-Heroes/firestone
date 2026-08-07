/**
 * Ground DIVINE_SHIELD for entity 6743 from the raw power.log.
 * Uses PowerTaskList TAG_CHANGEs only — that is the stream Firestone snapshots at
 * BG_BATTLE_STARTING=0 for simulator board input.
 */
const ENTITY_ID = 6743;
const PTL_DIVINE_SHIELD_RE = new RegExp(
	`PowerTaskList\\.DebugPrintPower\\(\\)\\s+-\\s+TAG_CHANGE Entity=(?:\\[entityName=[^\\]]*id=${ENTITY_ID}[^\\]]*\\]|${ENTITY_ID})\\s+tag=DIVINE_SHIELD\\s+value=(\\d+)`,
);
const PTL_BATTLE_START_0_RE =
	/PowerTaskList\.DebugPrintPower\(\)\s+-\s+TAG_CHANGE Entity=GameEntity tag=(?:BG_BATTLE_STARTING|2022) value=0/;

export function extractLastPreBattleDivineShieldForEntity6743(logLines: readonly string[]): number | null {
	let lastPtlDs: number | null = null;
	let lastPreBattleDs: number | null = null;
	for (const line of logLines) {
		if (PTL_BATTLE_START_0_RE.test(line)) {
			lastPreBattleDs = lastPtlDs;
		}
		const m = line.match(PTL_DIVINE_SHIELD_RE);
		if (m) {
			lastPtlDs = Number(m[1]);
		}
	}
	return lastPreBattleDs;
}
