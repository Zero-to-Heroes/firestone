/**
 * Chainbreaker Hogger (JAIL_384): Start of Game — Duplicate all other Legendary cards in your deck.
 * Warptooth (JAIL_421): Charge. If four friendly characters take damage on one of your turns,
 * summon this from hand or deck.
 *
 * Fixture (local player = player 2, 吹虾酒馆丨剑心): Hogger SoG creates Warptooth entity 80;
 * later both original (entity 34) and Hogger copy (entity 80) leave DECK→PLAY in the same turn.
 * Truncated after both summons settle (before hero power).
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as path from 'path';

export const WARPTOOTH_LOG_PATH = path.resolve(__dirname, 'warptooth.log');

/** Power.log player id of the Hogger / Warptooth user (local player in this fixture). */
export const WARPTOOTH_CONTROLLER_ID = 2;
export const CHAINBREAKER_HOGGER_ENTITY_ID = 58;
export const CHAINBREAKER_HOGGER_CARD_ID = CardIds.ChainbreakerHogger_JAIL_384;
export const WARPTOOTH_CARD_ID = CardIds.Warptooth_JAIL_421;

/** Original starter-deck Warptooth (revealed on summon). */
export const ORIGINAL_WARPTOOTH_ENTITY_ID = 34;
/** Hogger SoG copy of Warptooth. */
export const HOGGER_WARPTOOTH_COPY_ENTITY_ID = 80;

export type WarptoothDualSummonMarkers = {
	readonly controllerId: number;
	readonly hoggerEntityId: number;
	readonly hoggerCreatedWarptoothEntityId: number;
	readonly originalWarptoothEntityId: number;
	readonly originalSummonedToPlay: boolean;
	readonly copySummonedToPlay: boolean;
};

/**
 * Ground dual-summon expectations in the fixture log (not guessed).
 */
export function parseWarptoothDualSummonMarkers(lines: readonly string[]): WarptoothDualSummonMarkers {
	const hoggerStartIndex = lines.findIndex(
		(line) =>
			line.includes('PowerTaskList.DebugPrintPower()') &&
			line.includes('BLOCK_START BlockType=TRIGGER') &&
			line.includes(`id=${CHAINBREAKER_HOGGER_ENTITY_ID} zone=DECK`) &&
			line.includes(`cardId=${CHAINBREAKER_HOGGER_CARD_ID}`) &&
			line.includes('TriggerKeyword=START_OF_GAME_KEYWORD'),
	);
	if (hoggerStartIndex < 0) {
		throw new Error('[warptooth] Missing Hogger START_OF_GAME block');
	}

	const hoggerBlockEnd = lines.findIndex(
		(line, index) =>
			index > hoggerStartIndex && line.includes('PowerTaskList.DebugPrintPower()') && line.includes('BLOCK_END'),
	);
	if (hoggerBlockEnd < 0) {
		throw new Error('[warptooth] Missing Hogger START_OF_GAME BLOCK_END');
	}

	let hoggerCreatedWarptoothEntityId = -1;
	for (let i = hoggerStartIndex; i < hoggerBlockEnd; i++) {
		const show = lines[i].match(
			/SHOW_ENTITY - Updating Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+) zone=DECK .* player=(\d+)\] CardID=JAIL_421/,
		);
		if (!show) {
			continue;
		}
		const entityId = parseInt(show[1], 10);
		const player = parseInt(show[2], 10);
		if (player !== WARPTOOTH_CONTROLLER_ID) {
			continue;
		}
		let creatorIsHogger = false;
		for (let j = i + 1; j < Math.min(i + 40, hoggerBlockEnd); j++) {
			if (lines[j].includes('SHOW_ENTITY - Updating Entity=')) {
				break;
			}
			if (lines[j].includes(`tag=CREATOR value=${CHAINBREAKER_HOGGER_ENTITY_ID}`)) {
				creatorIsHogger = true;
				break;
			}
		}
		if (creatorIsHogger) {
			hoggerCreatedWarptoothEntityId = entityId;
			break;
		}
	}
	if (hoggerCreatedWarptoothEntityId < 0) {
		throw new Error('[warptooth] Hogger SoG did not create a Warptooth DECK entity');
	}

	const originalShowIndex = lines.findIndex(
		(line) =>
			line.includes('PowerTaskList.DebugPrintPower()') &&
			line.includes(
				`SHOW_ENTITY - Updating Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=${ORIGINAL_WARPTOOTH_ENTITY_ID} zone=DECK`,
			) &&
			line.includes('CardID=JAIL_421'),
	);
	if (originalShowIndex < 0) {
		throw new Error('[warptooth] Missing SHOW_ENTITY for original Warptooth (entity 34)');
	}
	let originalSummonedToPlay = false;
	for (let j = originalShowIndex + 1; j < Math.min(originalShowIndex + 40, lines.length); j++) {
		if (lines[j].includes('SHOW_ENTITY - Updating Entity=')) {
			break;
		}
		if (lines[j].includes('tag=ZONE value=PLAY')) {
			originalSummonedToPlay = true;
			break;
		}
	}

	const copySummonedToPlay = lines.some(
		(line) =>
			line.includes('PowerTaskList.DebugPrintPower()') &&
			line.includes(
				`TAG_CHANGE Entity=[entityName=突牙 id=${HOGGER_WARPTOOTH_COPY_ENTITY_ID} zone=DECK`,
			) &&
			line.includes('cardId=JAIL_421') &&
			line.includes('tag=ZONE value=PLAY'),
	);

	return {
		controllerId: WARPTOOTH_CONTROLLER_ID,
		hoggerEntityId: CHAINBREAKER_HOGGER_ENTITY_ID,
		hoggerCreatedWarptoothEntityId,
		originalWarptoothEntityId: ORIGINAL_WARPTOOTH_ENTITY_ID,
		originalSummonedToPlay,
		copySummonedToPlay,
	};
}
