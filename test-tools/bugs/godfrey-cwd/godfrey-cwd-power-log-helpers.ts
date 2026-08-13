import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

export const GODFREY_ATLAS_CREATOR = CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e;
export const SHRED_OF_TIME_CARD_ID = CardIds.TwilightTimehopper_ShredOfTimeToken_TIME_025t;
export const DEMONIC_CONFINEMENT_CARD_ID = CardIds.DemonicConfinement_JAIL_997;

const GODFREY_RETURN_SUB_SPELL = 'JAILFX_Godfrey_CardsInHand_OverrideSpawn';
const BURNED_CARD_META = 'META_DATA - Meta=BURNED_CARD';
const ATLAS_PENDING_RE =
	/GameState\.DebugPrintPower\(\) - .*\[entityName=Godfrey's Atlas id=\d+[^\]]*\] tag=TAG_SCRIPT_DATA_NUM_2 value=(\d+)/g;
const END_TASK_LIST_RE = /PowerProcessor\.EndCurrentTaskList\(\) - m_currentTaskList=(\d+)/;

export interface GodfreyCwdOverdrawFromLog {
	readonly burnedEntityId: number;
	readonly cardId: string;
	readonly returnTokenEntityId: number;
}

export interface GodfreyBurnedCardFromLog {
	readonly entityId: number;
	readonly cardId: string;
}

/**
 * Last-game lines, cut after the PowerTaskList OverrideSpawn that moves the CWD return
 * token (142) SETASIDE → HAND. Drops the later Velocidrake CWD (entity 154).
 */
export function buildGodfreyCwdTruncatedLogContent(fullRaw: string): string {
	const lines = trimPowerLogLinesToLastGame(fullRaw.split(/\r?\n/));
	const cutIdx = findGodfreyCwdReturnTaskListEndIndex(lines);
	if (cutIdx < 0) {
		throw new Error('[godfrey-cwd] could not find PowerTaskList OverrideSpawn of the CWD return token');
	}
	return lines.slice(0, cutIdx + 1).join('\n') + '\n';
}

export function findGodfreyCwdReturnTaskListEndIndex(lines: readonly string[]): number {
	const cwd = parseGodfreyCwdOverdraw(lines.join('\n'));
	if (!cwd) {
		return -1;
	}
	const sourceNeedle = `Source=${cwd.returnTokenEntityId} TargetCount=`;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes('PowerTaskList.DebugPrintPower()')) {
			continue;
		}
		if (!line.includes(GODFREY_RETURN_SUB_SPELL) || !line.includes(sourceNeedle)) {
			continue;
		}
		for (let j = i; j < lines.length; j++) {
			if (END_TASK_LIST_RE.test(lines[j])) {
				return j;
			}
		}
		return -1;
	}
	return -1;
}

/** Last Atlas pending-queue length (TAG_SCRIPT_DATA_NUM_2, GameState stream). */
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
 * First Godfrey overdraw of a Cast When Drawn card: history copy SHOW_ENTITY with
 * CASTS_WHEN_DRAWN + COPIED_FROM (return token), then BURNED_CARD of the original.
 */
export function parseGodfreyCwdOverdraw(raw: string): GodfreyCwdOverdrawFromLog | null {
	const lines = raw.split(/\r?\n/);
	const protIdx = lines.findIndex(
		(l) => l.includes('GameState.DebugPrintPower()') && l.includes('tag=GODFREY_OVERDRAW_PROTECTION value=1'),
	);
	if (protIdx < 0) {
		return null;
	}

	let returnTokenEntityId: number | null = null;
	let stampedCardId: string | null = null;
	for (let i = protIdx; i < Math.min(protIdx + 80, lines.length); i++) {
		const showMatch = lines[i].match(
			/GameState\.DebugPrintPower\(\) - .*SHOW_ENTITY - Updating Entity=(\d+) CardID=(\w+)/,
		);
		if (!showMatch) {
			continue;
		}
		const cardId = showMatch[2];
		let copiedFrom: number | null = null;
		let castsWhenDrawn = false;
		for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
			if (lines[j].includes('SHOW_ENTITY -') || lines[j].includes('FULL_ENTITY -')) {
				break;
			}
			if (lines[j].includes('tag=CASTS_WHEN_DRAWN value=1')) {
				castsWhenDrawn = true;
			}
			const copyMatch = lines[j].match(/tag=COPIED_FROM_ENTITY_ID value=(\d+)/);
			if (copyMatch) {
				copiedFrom = Number(copyMatch[1]);
			}
		}
		if (castsWhenDrawn && copiedFrom != null && copiedFrom > 0) {
			returnTokenEntityId = copiedFrom;
			stampedCardId = cardId;
			break;
		}
	}
	if (returnTokenEntityId == null || !stampedCardId) {
		return null;
	}

	for (let i = protIdx; i < Math.min(protIdx + 120, lines.length); i++) {
		if (!lines[i].includes('GameState.DebugPrintPower()') || !lines[i].includes(BURNED_CARD_META)) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			const infoMatch = lines[j].match(
				/Info\[\d+\] = \[entityName=.+ id=(\d+) zone=\w+ zonePos=\d+ cardId= player=2\]/,
			);
			if (!infoMatch) {
				continue;
			}
			const burnedEntityId = Number(infoMatch[1]);
			const cardId = lastShowEntityCardId(lines, i, burnedEntityId) ?? stampedCardId;
			return { burnedEntityId, cardId, returnTokenEntityId };
		}
	}
	return null;
}

/**
 * Opponent (player 2) cards burned during Godfrey overdraw (all BURNED_CARD after
 * GODFREY_OVERDRAW_PROTECTION).
 */
export function parseGodfreyOverdrawBurnedCards(raw: string): GodfreyBurnedCardFromLog[] {
	const lines = raw.split(/\r?\n/);
	const protIdx = lines.findIndex(
		(l) => l.includes('GameState.DebugPrintPower()') && l.includes('tag=GODFREY_OVERDRAW_PROTECTION value=1'),
	);
	if (protIdx < 0) {
		return [];
	}
	const result: GodfreyBurnedCardFromLog[] = [];
	const seen = new Set<number>();
	for (let i = protIdx; i < lines.length; i++) {
		const line = lines[i];
		if (!line.includes('GameState.DebugPrintPower()') || !line.includes(BURNED_CARD_META)) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			const infoMatch = lines[j].match(
				/Info\[\d+\] = \[entityName=.+ id=(\d+) zone=\w+ zonePos=\d+ cardId= player=2\]/,
			);
			if (!infoMatch) {
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

function lastShowEntityCardId(lines: readonly string[], beforeIndex: number, entityId: number): string | null {
	const showRe = new RegExp(
		`GameState\\.DebugPrintPower\\(\\) - .*id=${entityId} zone=\\w+ zonePos=\\d+ cardId= player=2\\] CardID=(\\w+)`,
	);
	let last: string | null = null;
	for (let i = 0; i < beforeIndex; i++) {
		const m = lines[i].match(showRe);
		if (m) {
			last = m[1];
		}
	}
	if (last) {
		return last;
	}
	const altRe = new RegExp(
		`GameState\\.DebugPrintPower\\(\\) - .*SHOW_ENTITY - Updating Entity=${entityId} CardID=(\\w+)`,
	);
	for (let i = 0; i < beforeIndex; i++) {
		const m = lines[i].match(altRe);
		if (m) {
			last = m[1];
		}
	}
	return last;
}
