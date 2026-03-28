/**
 * Parse values from power.log for Ivory Rook (WON_116) discover + armor tests.
 */

const HERO_ARMOR_LINE_RE =
	/TAG_CHANGE Entity=\[[^\]]*cardId=HERO_01 player=1\][^\n]*\btag=ARMOR value=(\d+)/;

function extractHeroEntityIdFromSubSpellTargets(lines: readonly string[], subSpellLineIndex: number): number | null {
	for (let i = subSpellLineIndex + 1; i < Math.min(subSpellLineIndex + 12, lines.length); i++) {
		const m = lines[i].match(/Targets\[0\] = \[entityName=[^\]]*?\bid=(\d+)\b/);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

function lastHeroArmorBeforeLine(lines: readonly string[], heroEntityId: number, beforeIndex: number): number {
	const re = new RegExp(
		`TAG_CHANGE Entity=\\[[^\\]]*\\bid=${heroEntityId}\\b[^\\]]*\\]\\s*tag=ARMOR value=(\\d+)`,
	);
	let last = 0;
	for (let i = 0; i < beforeIndex; i++) {
		const m = lines[i].match(re);
		if (m) {
			last = parseInt(m[1], 10);
		}
	}
	return last;
}

function firstHeroArmorAtOrAfterLine(lines: readonly string[], heroEntityId: number, fromIndex: number): number | null {
	const re = new RegExp(
		`TAG_CHANGE Entity=\\[[^\\]]*\\bid=${heroEntityId}\\b[^\\]]*\\]\\s*tag=ARMOR value=(\\d+)`,
	);
	for (let i = fromIndex; i < lines.length; i++) {
		const m = lines[i].match(re);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

/**
 * Mana cost of the discovered Taunt (= armor gained from Ivory Rook battlecry), or null if missing.
 */
export function extractIvoryRookDiscoverArmorGainFromPowerLogLines(lines: readonly string[]): number | null {
	let subIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].includes('SUB_SPELL_START')) {
			continue;
		}
		const window = lines.slice(i, Math.min(i + 6, lines.length)).join('\n');
		if (window.includes('Ivory Rook') && window.includes('WON_116')) {
			subIdx = i;
			break;
		}
	}
	if (subIdx < 0) {
		return null;
	}
	const heroId = extractHeroEntityIdFromSubSpellTargets(lines, subIdx);
	let prevArmor: number;
	let newArmor: number | null;
	if (heroId != null) {
		prevArmor = lastHeroArmorBeforeLine(lines, heroId, subIdx);
		newArmor = firstHeroArmorAtOrAfterLine(lines, heroId, subIdx);
	} else {
		prevArmor = 0;
		for (let i = 0; i < subIdx; i++) {
			const m = lines[i].match(HERO_ARMOR_LINE_RE);
			if (m) {
				prevArmor = parseInt(m[1], 10);
			}
		}
		newArmor = null;
		for (let i = subIdx; i < Math.min(subIdx + 25, lines.length); i++) {
			const m = lines[i].match(HERO_ARMOR_LINE_RE);
			if (m) {
				newArmor = parseInt(m[1], 10);
				break;
			}
		}
	}
	if (newArmor == null) {
		return null;
	}
	return newArmor - prevArmor;
}
