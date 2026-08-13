/**
 * Parse values from power.log for Ivory Knight (CORE_KAR_057) discover + heal tests.
 *
 * If the hero is still damaged after the heal, the discovered spell costs exactly the
 * heal amount. If DAMAGE is 0 (full health), the cost is only known to be >= heal.
 */

export type IvoryKnightDiscoverHeal = {
	readonly healAmount: number;
	readonly postHealHeroDamage: number;
};

const HEALING_META_RE = /Meta=HEALING Data=(\d+)/;
const HEAL_TARGET_RE = /Info\[\d+\] = \[entityName=[^\]]*?\bid=(\d+)\b/;
const IVORY_KNIGHT_POWER_RE = /BLOCK_START BlockType=POWER Entity=\[[^\]]*cardId=CORE_KAR_057/;

function heroDamageAfterHeal(lines: readonly string[], fromIndex: number, heroEntityId: number): number | null {
	const re = new RegExp(`TAG_CHANGE Entity=\\[[^\\]]*\\bid=${heroEntityId}\\b[^\\]]*\\]\\s*tag=DAMAGE value=(\\d+)`);
	for (let i = fromIndex; i < lines.length; i++) {
		const m = lines[i].match(re);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

/**
 * Applied heal from Ivory Knight battlecry, plus the healed hero's DAMAGE after it.
 * Returns null if the discover/heal window is missing from the log.
 */
export function extractIvoryKnightDiscoverHealFromPowerLogLines(
	lines: readonly string[],
): IvoryKnightDiscoverHeal | null {
	let powerIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (IVORY_KNIGHT_POWER_RE.test(lines[i])) {
			powerIdx = i;
			break;
		}
	}
	if (powerIdx < 0) {
		return null;
	}

	let healAmount: number | null = null;
	let healIdx = -1;
	let heroEntityId: number | null = null;
	for (let i = powerIdx; i < lines.length; i++) {
		const healMatch = lines[i].match(HEALING_META_RE);
		if (healMatch) {
			healAmount = parseInt(healMatch[1], 10);
			healIdx = i;
			for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
				const target = lines[j].match(HEAL_TARGET_RE);
				if (target) {
					heroEntityId = parseInt(target[1], 10);
					break;
				}
			}
			break;
		}
	}
	if (healAmount == null || healIdx < 0 || heroEntityId == null) {
		return null;
	}

	const postHealHeroDamage = heroDamageAfterHeal(lines, healIdx, heroEntityId);
	if (postHealHeroDamage == null) {
		return null;
	}

	return { healAmount, postHealHeroDamage };
}
