/**
 * Parse Chainbreaker Hogger (JAIL_384) deck identity markers from power.log lines.
 *
 * Fixture: Chmielinho#2928 (player 1). Entity 12 is Chainbreaker Hogger in the initial deck;
 * it is created as FULL_ENTITY with empty CardID, then revealed via SHOW_ENTITY at start of game.
 *
 * Replay uses `chainbreaker-hogger.log` in this folder (no truncation).
 */

import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const CHAINBREAKER_HOGGER_POWER_LOG_PATH = path.join(__dirname, 'chainbreaker-hogger.log');

export const CHAINBREAKER_HOGGER_ENTITY_ID = 12;
export const CHAINBREAKER_HOGGER_CARD_ID = CardIds.ChainbreakerHogger_JAIL_384;

/** Opponent Azalina start-of-game Hogger copy (player 2). */
export const OPPONENT_HOGGER_COPY_ENTITY_ID = 64;

/**
 * Game event that corrupts the player deck (`copied-from-entity-id-parser.ts`):
 * - type: COPIED_FROM_ENTITY_ID
 * - entityId: 64, cardId: JAIL_384, controllerId: 2 (opponent)
 * - copiedCardEntityId: 12, copiedCardControllerId: 1 (player), copiedCardZone: DECK (2)
 * Logged from PowerTaskList SHOW_ENTITY at 14:45:18.7940388 (~line 2088 in test-tools/power.log).
 */
export const BUG_TRIGGER_COPIED_FROM_SOURCE_ENTITY_ID = CHAINBREAKER_HOGGER_ENTITY_ID;

/** Reporter deckstring (Warrior, includes Chainbreaker Hogger). */
export const PLAYER_DECKSTRING =
	'AAECAZW2BwL2yQey2AcOsMkH2tcHpNgHjdoH19oH29oHk9sHydsH1tsHptwHv98HyOUHyucHhOgHAAA=';

const SHOW_ENTITY_HOGGER = new RegExp(
	`SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${CHAINBREAKER_HOGGER_ENTITY_ID} zone=DECK.*\\] CardID=${CHAINBREAKER_HOGGER_CARD_ID}`,
);
const HIDE_ENTITY_HOGGER_AFTER_REVEAL = new RegExp(
	`HIDE_ENTITY - Entity=\\[entityName=.* id=${CHAINBREAKER_HOGGER_ENTITY_ID} zone=DECK.* player=1\\] tag=ZONE value=DECK`,
);
/** PowerTaskList replay block — second SHOW_ENTITY for opponent Hogger copy; closes into COPIED_FROM_ENTITY_ID. */
const POWER_TASK_LIST_OPPONENT_HOGGER_COPY_SHOW_ENTITY = new RegExp(
	`PowerTaskList\\.DebugPrintPower\\(\\) -\\s+SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${OPPONENT_HOGGER_COPY_ENTITY_ID} zone=DECK.*\\] CardID=${CHAINBREAKER_HOGGER_CARD_ID}`,
);
const COPIED_FROM_PLAYER_HOGGER = new RegExp(
	`tag=COPIED_FROM_ENTITY_ID value=${BUG_TRIGGER_COPIED_FROM_SOURCE_ENTITY_ID}`,
);

export type ChainbreakerHoggerFixtureMarkers = {
	readonly hoggerEntityId: number;
	readonly hoggerCardId: string;
	readonly hoggerRevealLineIndex: number;
	readonly hoggerHideAfterRevealLineIndex: number;
	/** PowerTaskList SHOW_ENTITY for entity 64 / JAIL_384 (bug-trigger COPIED_FROM_ENTITY_ID). */
	readonly opponentHoggerCopyShowEntityLineIndex: number;
	readonly opponentHoggerCopyCopiedFromLineIndex: number;
};

/**
 * Ground Hogger reveal markers in the fixture log (not guessed).
 */
export function parseChainbreakerHoggerFixtureMarkers(lines: readonly string[]): ChainbreakerHoggerFixtureMarkers {
	let hoggerRevealLineIndex: number | undefined;
	let hoggerHideAfterRevealLineIndex: number | undefined;
	let opponentHoggerCopyShowEntityLineIndex: number | undefined;
	let opponentHoggerCopyCopiedFromLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (hoggerRevealLineIndex == null && SHOW_ENTITY_HOGGER.test(line)) {
			hoggerRevealLineIndex = i;
		}
		if (hoggerHideAfterRevealLineIndex == null && HIDE_ENTITY_HOGGER_AFTER_REVEAL.test(line)) {
			hoggerHideAfterRevealLineIndex = i;
		}
		if (opponentHoggerCopyShowEntityLineIndex == null && POWER_TASK_LIST_OPPONENT_HOGGER_COPY_SHOW_ENTITY.test(line)) {
			opponentHoggerCopyShowEntityLineIndex = i;
		}
	}

	if (opponentHoggerCopyShowEntityLineIndex != null) {
		for (
			let i = opponentHoggerCopyShowEntityLineIndex;
			i < Math.min(lines.length, opponentHoggerCopyShowEntityLineIndex + 80);
			i++
		) {
			if (COPIED_FROM_PLAYER_HOGGER.test(lines[i])) {
				opponentHoggerCopyCopiedFromLineIndex = i;
				break;
			}
		}
	}

	if (hoggerRevealLineIndex == null) {
		throw new Error(
			`[chainbreaker-hogger] Could not find SHOW_ENTITY for entity ${CHAINBREAKER_HOGGER_ENTITY_ID} CardID=${CHAINBREAKER_HOGGER_CARD_ID}`,
		);
	}
	if (hoggerHideAfterRevealLineIndex == null) {
		throw new Error(
			`[chainbreaker-hogger] Could not find HIDE_ENTITY after Hogger reveal for entity ${CHAINBREAKER_HOGGER_ENTITY_ID}`,
		);
	}
	if (opponentHoggerCopyShowEntityLineIndex == null || opponentHoggerCopyCopiedFromLineIndex == null) {
		throw new Error(
			`[chainbreaker-hogger] Could not find PowerTaskList SHOW_ENTITY entity ${OPPONENT_HOGGER_COPY_ENTITY_ID} with COPIED_FROM_ENTITY_ID=${BUG_TRIGGER_COPIED_FROM_SOURCE_ENTITY_ID}`,
		);
	}

	return {
		hoggerEntityId: CHAINBREAKER_HOGGER_ENTITY_ID,
		hoggerCardId: CHAINBREAKER_HOGGER_CARD_ID,
		hoggerRevealLineIndex,
		hoggerHideAfterRevealLineIndex,
		opponentHoggerCopyShowEntityLineIndex,
		opponentHoggerCopyCopiedFromLineIndex,
	};
}
