const GODFREY_RETURN_SUB_SPELL = 'JAILFX_Godfrey_CardsInHand_OverrideSpawn';
const ATLAS_PENDING_RE =
	/GameState\.DebugPrintPower\(\) - .*\[entityName=Godfrey's Atlas id=76[^\]]*\] tag=TAG_SCRIPT_DATA_NUM_2 value=(\d+)/g;
const BURNED_CARD_META = 'META_DATA - Meta=BURNED_CARD';

export interface GodfreyBurnedCardFromLog {
	readonly entityId: number;
	readonly cardId: string;
}

/** Last Atlas pending-queue length (TAG_SCRIPT_DATA_NUM_2 on entity 76). */
export function parseLastGodfreyAtlasPendingCount(raw: string): number | null {
	let last: number | null = null;
	let m: RegExpExecArray | null;
	ATLAS_PENDING_RE.lastIndex = 0;
	while ((m = ATLAS_PENDING_RE.exec(raw)) !== null) {
		last = Number(m[1]);
	}
	return last;
}

/**
 * Entity ids moved SETASIDE → HAND by Godfrey's CardsInHand_OverrideSpawn (Source ≠ 0).
 * GameState lines only so PowerTaskList echoes are not double-counted.
 */
export function parseGodfreyReturnedHandEntityIds(raw: string): number[] {
	const ids = new Set<number>();
	const lines = raw.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes('GameState.DebugPrintPower()')) {
			continue;
		}
		if (!line.includes(GODFREY_RETURN_SUB_SPELL)) {
			continue;
		}
		const sourceMatch = line.match(/Source=(\d+) TargetCount=/);
		if (!sourceMatch) {
			continue;
		}
		const entityId = Number(sourceMatch[1]);
		if (entityId === 0) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			if (lines[j].includes(`id=${entityId} zone=SETASIDE`) && lines[j].includes('tag=ZONE value=HAND')) {
				ids.add(entityId);
				break;
			}
		}
	}
	return [...ids].sort((a, b) => a - b);
}

/**
 * Opponent (player 1) cards burned during Godfrey overdraw. Card ids come from the
 * last SHOW_ENTITY for each BURNED_CARD info entity before the meta line.
 */
export function parseOpponentGodfreyBurnedCards(raw: string): GodfreyBurnedCardFromLog[] {
	const lines = raw.split(/\r?\n/);
	const result: GodfreyBurnedCardFromLog[] = [];
	const seen = new Set<number>();
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes('GameState.DebugPrintPower()') || !line.includes(BURNED_CARD_META)) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			const infoMatch = lines[j].match(
				/Info\[\d+\] = \[entityName=.+ id=(\d+) zone=\w+ zonePos=\d+ cardId= player=1\]/,
			);
			if (!infoMatch) {
				if (lines[j].includes('Info[') && lines[j].includes('player=2')) {
					continue;
				}
				if (!lines[j].includes('Info[')) {
					break;
				}
				continue;
			}
			const entityId = Number(infoMatch[1]);
			if (seen.has(entityId)) {
				continue;
			}
			const cardId = lastShowEntityCardId(lines, i, entityId);
			if (!cardId) {
				continue;
			}
			seen.add(entityId);
			result.push({ entityId, cardId });
		}
	}
	return result;
}

function lastShowEntityCardId(lines: readonly string[], beforeIndex: number, entityId: number): string | null {
	const showRe = new RegExp(
		`GameState\\.DebugPrintPower\\(\\) - .*id=${entityId} zone=\\w+ zonePos=\\d+ cardId= player=1\\] CardID=(\\w+)`,
	);
	let last: string | null = null;
	for (let i = 0; i < beforeIndex; i++) {
		const m = lines[i].match(showRe);
		if (m) {
			last = m[1];
		}
	}
	return last;
}
