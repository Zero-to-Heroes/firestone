/**
 * Parse Repackage (TOY_879) resolution from power.log lines.
 * Ground truth: one Repackaged Box (TOY_879t) shuffled into opponent deck, 10 minions stuffed.
 */

const REPACKAGE_SUB_SPELL =
	/SUB_SPELL_START.*TOYFX_Reseal_MinionWarp_Super.*TargetCount=(\d+)/;
const REPACKAGE_TARGET = /Targets\[(\d+)\] = \[entityName=.* id=(\d+) zone=PLAY/;
const REPACKAGE_BOX_SHOW_PTL =
	/PowerTaskList\.DebugPrintPower\(\).*SHOW_ENTITY.*CardID=TOY_879t/;
const REPACKAGE_BOX_CONTROLLER_OPP = /tag=CONTROLLER value=2/;

/**
 * Entity ids of minions targeted by Repackage's MinionWarp sub-spell (PowerTaskList block).
 */
export function extractRepackageStuffedMinionEntityIdsFromPowerLogLines(lines: readonly string[]): number[] {
	const entityIds: number[] = [];
	let inRepackageBlock = false;
	let expectedTargets = 0;

	for (const line of lines) {
		if (!line.includes('PowerTaskList.DebugPrintPower()')) {
			continue;
		}
		const subSpellMatch = line.match(REPACKAGE_SUB_SPELL);
		if (subSpellMatch) {
			inRepackageBlock = true;
			expectedTargets = parseInt(subSpellMatch[1], 10);
			entityIds.length = 0;
			continue;
		}
		if (inRepackageBlock) {
			const targetMatch = line.match(REPACKAGE_TARGET);
			if (targetMatch) {
				entityIds.push(parseInt(targetMatch[2], 10));
			}
			if (line.includes('SUB_SPELL_END') && entityIds.length >= expectedTargets && expectedTargets > 0) {
				break;
			}
		}
	}
	return entityIds;
}

/**
 * Count SHOW_ENTITY TOY_879t spawns into opponent deck in PowerTaskList section.
 */
export function countRepackageBoxSpawnsInOpponentDeckFromPowerLogLines(lines: readonly string[]): number {
	let count = 0;
	let inShowEntity = false;
	let isOpponentBox = false;

	for (const line of lines) {
		if (!line.includes('PowerTaskList.DebugPrintPower()')) {
			continue;
		}
		if (line.match(REPACKAGE_BOX_SHOW_PTL)) {
			inShowEntity = true;
			isOpponentBox = false;
			continue;
		}
		if (inShowEntity) {
			if (REPACKAGE_BOX_CONTROLLER_OPP.test(line)) {
				isOpponentBox = true;
			}
			if (line.includes('SHOW_ENTITY') || line.includes('HIDE_ENTITY')) {
				if (isOpponentBox) {
					count++;
				}
				inShowEntity = false;
				isOpponentBox = false;
			}
		}
	}
	return count;
}
