/**
 * Parse King Llane / Chainbreaker Hogger copy-gift markers from power.log lines.
 *
 * Fixture local player is Chmielinho#2928 (PlayerId 2, Garona package):
 * - Entity 55: local King Llane (TIME_875t) in local deck (Garona fabled package)
 * - Entity 69: King Llane copy created into opponent (HattriK) deck by entity 55 Start of Game
 * - Entity 70: Hogger (JAIL_384, entity 21) on opponent side duplicates that legendary; later played
 *   with COPIED_FROM_ENTITY_ID=69 and CREATOR=21
 *
 * Replay uses `king-llane-hogger-copy-gift.log` in this folder (no truncation).
 */

import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const KING_LLANE_HOGGER_COPY_GIFT_POWER_LOG_PATH = path.join(__dirname, 'king-llane-hogger-copy-gift.log');

export const OPPONENT_KING_LLANE_ENTITY_ID = 55;
export const PLAYER_HIDDEN_KING_LLANE_ENTITY_ID = 69;
export const HOGGER_COPY_ENTITY_ID = 70;
export const HOGGER_CREATOR_ENTITY_ID = 21;

export const KING_LLANE_CARD_ID = CardIds.GaronaHalforcen_KingLlaneToken_TIME_875t;
export const HOGGER_CARD_ID = CardIds.ChainbreakerHogger_JAIL_384;

/** PowerTaskList: Hogger SoG creates entity 70 in player deck. */
const HOGGER_CREATES_COPY_FULL_ENTITY = new RegExp(
	`FULL_ENTITY - Updating \\[entityName=.* id=${HOGGER_COPY_ENTITY_ID} zone=DECK.* player=1\\]`,
);

/** PowerTaskList: play SHOW_ENTITY for entity 70 as King Llane. */
const POWER_TASK_LIST_HOGGER_COPY_SHOW_ENTITY = new RegExp(
	`PowerTaskList\\.DebugPrintPower\\(\\) -\\s+SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${HOGGER_COPY_ENTITY_ID} zone=HAND.*\\] CardID=${KING_LLANE_CARD_ID}`,
);

const COPIED_FROM_HIDDEN_KING_LLANE = new RegExp(
	`tag=COPIED_FROM_ENTITY_ID value=${PLAYER_HIDDEN_KING_LLANE_ENTITY_ID}`,
);

const CREATOR_HOGGER = new RegExp(`tag=CREATOR value=${HOGGER_CREATOR_ENTITY_ID}`);

export type KingLlaneHoggerCopyGiftFixtureMarkers = {
	readonly hoggerCreatesCopyLineIndex: number;
	readonly hoggerCopyShowEntityLineIndex: number;
	readonly hoggerCopyCopiedFromLineIndex: number;
	readonly hoggerCopyCreatorLineIndex: number;
};

/**
 * Ground bug-trigger markers in the fixture log (not guessed).
 */
export function parseKingLlaneHoggerCopyGiftFixtureMarkers(
	lines: readonly string[],
): KingLlaneHoggerCopyGiftFixtureMarkers {
	let hoggerCreatesCopyLineIndex: number | undefined;
	let hoggerCopyShowEntityLineIndex: number | undefined;
	let hoggerCopyCopiedFromLineIndex: number | undefined;
	let hoggerCopyCreatorLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (hoggerCreatesCopyLineIndex == null && HOGGER_CREATES_COPY_FULL_ENTITY.test(line)) {
			hoggerCreatesCopyLineIndex = i;
		}
		if (hoggerCopyShowEntityLineIndex == null && POWER_TASK_LIST_HOGGER_COPY_SHOW_ENTITY.test(line)) {
			hoggerCopyShowEntityLineIndex = i;
		}
	}

	if (hoggerCopyShowEntityLineIndex != null) {
		for (let i = hoggerCopyShowEntityLineIndex; i < Math.min(lines.length, hoggerCopyShowEntityLineIndex + 80); i++) {
			if (hoggerCopyCreatorLineIndex == null && CREATOR_HOGGER.test(lines[i])) {
				hoggerCopyCreatorLineIndex = i;
			}
			if (hoggerCopyCopiedFromLineIndex == null && COPIED_FROM_HIDDEN_KING_LLANE.test(lines[i])) {
				hoggerCopyCopiedFromLineIndex = i;
			}
			if (hoggerCopyCreatorLineIndex != null && hoggerCopyCopiedFromLineIndex != null) {
				break;
			}
		}
	}

	if (hoggerCreatesCopyLineIndex == null) {
		throw new Error(
			`[king-llane-hogger-copy-gift] Could not find FULL_ENTITY for Hogger copy entity ${HOGGER_COPY_ENTITY_ID}`,
		);
	}
	if (hoggerCopyShowEntityLineIndex == null) {
		throw new Error(
			`[king-llane-hogger-copy-gift] Could not find PowerTaskList SHOW_ENTITY entity ${HOGGER_COPY_ENTITY_ID} CardID=${KING_LLANE_CARD_ID}`,
		);
	}
	if (hoggerCopyCopiedFromLineIndex == null || hoggerCopyCreatorLineIndex == null) {
		throw new Error(
			`[king-llane-hogger-copy-gift] Could not find CREATOR=${HOGGER_CREATOR_ENTITY_ID} / COPIED_FROM_ENTITY_ID=${PLAYER_HIDDEN_KING_LLANE_ENTITY_ID} near SHOW_ENTITY for entity ${HOGGER_COPY_ENTITY_ID}`,
		);
	}

	return {
		hoggerCreatesCopyLineIndex,
		hoggerCopyShowEntityLineIndex,
		hoggerCopyCopiedFromLineIndex,
		hoggerCopyCreatorLineIndex,
	};
}
