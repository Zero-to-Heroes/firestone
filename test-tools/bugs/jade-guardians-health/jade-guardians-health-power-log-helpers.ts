/**
 * Fixture-grounded checks for jade-guardians-health.log.
 *
 * Jade Guardians (JAIL_474) tracks 2-mana cards via TAG_SCRIPT_DATA_NUM_1.
 * Blood Draw (TIME_612, entity 133) is played for 2 health (Meta=SPEND_HEALTH),
 * and that PLAY block must not increment Jade's script tag.
 * Fixture is truncated after PowerTaskList 417 (Blood Draw resolved; Jade still in hand).
 */

export const JADE_GUARDIANS_CARD_ID = 'JAIL_474';
export const BLOOD_DRAW_CARD_ID = 'TIME_612';
export const BLOOD_DRAW_ENTITY_ID = 133;

const GAME_STATE_PREFIX = 'GameState.DebugPrintPower() - ';

const JADE_SCRIPT_RE = /cardId=JAIL_474[^\]]*\] tag=TAG_SCRIPT_DATA_NUM_1 value=(\d+)/;
const SPEND_HEALTH_RE = /META_DATA - Meta=SPEND_HEALTH Data=(\d+)/;

/** Last Jade Guardians TAG_SCRIPT_DATA_NUM_1 from GameState.DebugPrintPower (game's 2-mana count). */
export function extractLastJadeGuardiansScriptDataNum1(lines: readonly string[]): number | null {
	let last: number | null = null;
	for (const line of lines) {
		if (!line.includes(GAME_STATE_PREFIX) || !line.includes(JADE_GUARDIANS_CARD_ID)) {
			continue;
		}
		const m = line.match(JADE_SCRIPT_RE);
		if (m) {
			last = parseInt(m[1], 10);
		}
	}
	return last;
}

export type BloodDrawPlayLogFacts = {
	readonly spendHealth: number | null;
	readonly jadeScriptUpdated: boolean;
};

/**
 * Facts from the GameState PLAY block for Blood Draw (entity 133): health spent,
 * and whether Jade Guardians TAG_SCRIPT_DATA_NUM_1 changed in that block.
 */
export function parseBloodDrawPlayLogFacts(lines: readonly string[]): BloodDrawPlayLogFacts | null {
	const playNeedle = `BLOCK_START BlockType=PLAY Entity=[entityName=Blood Draw id=${BLOOD_DRAW_ENTITY_ID} `;
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (
			line.includes(GAME_STATE_PREFIX) &&
			line.includes(playNeedle) &&
			line.includes(`cardId=${BLOOD_DRAW_CARD_ID}`)
		) {
			start = i;
			break;
		}
	}
	if (start < 0) {
		return null;
	}

	let depth = 0;
	let spendHealth: number | null = null;
	let jadeScriptUpdated = false;
	for (let i = start; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes(GAME_STATE_PREFIX)) {
			continue;
		}
		if (line.includes('BLOCK_START')) {
			depth++;
		}
		const spend = line.match(SPEND_HEALTH_RE);
		if (spend) {
			spendHealth = parseInt(spend[1], 10);
		}
		if (JADE_SCRIPT_RE.test(line)) {
			jadeScriptUpdated = true;
		}
		if (line.includes('BLOCK_END')) {
			depth--;
			if (depth === 0) {
				break;
			}
		}
	}
	return { spendHealth, jadeScriptUpdated };
}
