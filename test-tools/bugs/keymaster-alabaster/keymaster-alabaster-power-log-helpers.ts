/**
 * Parse Keymaster Alabaster draw-copy from power.log lines.
 *
 * Fixture: Chmielinho#2928 (player 1) vs vermilion#21968 (player 2). Keymaster Alabaster
 * (entity 374, CORE_SCH_717) on board. Opponent draws entity 34 (hidden). Keymaster adds copy
 * entity 380 (Core_UNG_072) with COPIED_FROM_ENTITY_ID=34.
 */

import { CardIds } from '@firestone-hs/reference-data';

const KEYMASTER_TRIGGER_BLOCK =
	/PowerTaskList\.DebugPrintPower\(\) - BLOCK_START BlockType=TRIGGER Entity=\[entityName=Keymaster Alabaster id=(\d+) zone=PLAY zonePos=\d+ cardId=(CORE_SCH_717|SCH_717) player=1\]/;
const FULL_ENTITY_COPY =
	/PowerTaskList\.DebugPrintPower\(\) - +FULL_ENTITY - (?:Creating ID=(\d+)|Updating \[entityName=.* id=(\d+) zone=HAND[^\]]*\]) CardID=([A-Za-z0-9_]+)/;
const COPIED_FROM_TAG =
	/PowerTaskList\.DebugPrintPower\(\) - +TAG_CHANGE Entity=\[entityName=.* id=(\d+) zone=HAND[^\]]*\] tag=COPIED_FROM_ENTITY_ID value=(\d+)/;

export const KEYMASTER_ALABASTER_CARD_IDS = [
	CardIds.KeymasterAlabaster,
	CardIds.KeymasterAlabaster_CORE_SCH_717,
] as const;

/** Power.log player id of the Keymaster controller (local player in fixture). */
export const KEYMASTER_LOCAL_PLAYER_ID = 1;

export type KeymasterDrawCopyFixtureCounts = {
	readonly keymasterEntityId: number;
	readonly opponentDrawnEntityId: number;
	readonly copyEntityId: number;
	readonly copyCardId: string;
	readonly keymasterCardId: string;
};

/**
 * Ground expected Keymaster draw-copy outcome in the fixture log (last PowerTaskList occurrence).
 */
export function parseKeymasterDrawCopyFromLog(lines: readonly string[]): KeymasterDrawCopyFixtureCounts {
	let lastMatch: KeymasterDrawCopyFixtureCounts | null = null;

	for (let i = 0; i < lines.length; i++) {
		const block = lines[i].match(KEYMASTER_TRIGGER_BLOCK);
		if (!block) {
			continue;
		}

		const keymasterEntityId = parseInt(block[1], 10);
		const keymasterCardId = block[2];

		let copyEntityId: number | undefined;
		let copyCardId: string | undefined;
		let opponentDrawnEntityId: number | undefined;

		for (let j = i + 1; j < Math.min(i + 80, lines.length); j++) {
			if (lines[j].includes('BLOCK_END') && j > i + 5) {
				break;
			}

			const fullEntity = lines[j].match(FULL_ENTITY_COPY);
			if (fullEntity) {
				copyEntityId = parseInt(fullEntity[1] ?? fullEntity[2], 10);
				copyCardId = fullEntity[3];
			}

			const copiedFrom = lines[j].match(COPIED_FROM_TAG);
			if (copiedFrom) {
				const copyId = parseInt(copiedFrom[1], 10);
				if (copyEntityId == null || copyId === copyEntityId) {
					opponentDrawnEntityId = parseInt(copiedFrom[2], 10);
					if (copyEntityId == null) {
						copyEntityId = copyId;
					}
					break;
				}
			}
		}

		if (copyEntityId != null && copyCardId?.length && opponentDrawnEntityId != null) {
			lastMatch = {
				keymasterEntityId,
				opponentDrawnEntityId,
				copyEntityId,
				copyCardId,
				keymasterCardId,
			};
		}
	}

	if (!lastMatch) {
		throw new Error('[keymaster-alabaster] Could not find Keymaster draw-copy block in fixture log');
	}

	const joined = lines.join('\n');
	const drawPattern = new RegExp(
		`id=${lastMatch.opponentDrawnEntityId} zone=DECK zonePos=\\d+ cardId=.* player=2\\] tag=ZONE value=HAND`,
	);
	if (!drawPattern.test(joined)) {
		throw new Error(
			`[keymaster-alabaster] Opponent entity ${lastMatch.opponentDrawnEntityId} DECK→HAND draw not found in fixture`,
		);
	}

	return lastMatch;
}
