/**
 * Derives expected Blooming Bulb upgrade count from the fixture: ranked-spell upgrade uses SUB_SPELL VFX
 * in PowerTaskList without TAG_SCRIPT_DATA_NUM_1 changes.
 */
export function countRankedSpellUpgradeSubSpellsInPowerTaskList(lines: readonly string[]): number {
	let count = 0;
	for (const line of lines) {
		if (
			line.includes('PowerTaskList.DebugPrintPower()') &&
			line.includes('SUB_SPELL_START') &&
			line.includes('BARFX_RankedSpell_Upgrade_Impact_Nature_Druid')
		) {
			count++;
		}
	}
	return count;
}

/** Initial script tier when Blooming Bulb is created (random 1-cost spells). */
export const BLOOMING_BULB_INITIAL_SCRIPT_TIER = 1;

export function expectedScriptTierAfterReplay(lines: readonly string[]): number {
	return BLOOMING_BULB_INITIAL_SCRIPT_TIER + countRankedSpellUpgradeSubSpellsInPowerTaskList(lines);
}
