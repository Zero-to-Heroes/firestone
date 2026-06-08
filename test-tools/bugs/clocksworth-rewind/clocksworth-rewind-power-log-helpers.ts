/**
 * Clocksworth Rewind regression helpers.
 *
 * Scenario (opponent = player 2, Jarod):
 *  - The opponent has Vanessa the Ringleader (id=42, JAIL_407) and Demolition Renovator
 *    (id=52, CORE_REV_023) on board.
 *  - During the local player's (PWeasil, player 1) turn, Fyrakk generates Decimation
 *    (CATA_581, entity 245), whose board-clear kills both minions: they move
 *    `ZONE=GRAVEYARD` with `tag=LAST_AFFECTED_BY value=245`.
 *  - The opponent then triggers Mister Clocksworth (TIME_038, id=236), a Rewind: a
 *    `BlockType=GAME_RESET` fires (rewind token carries `tag=REWIND value=1`).
 *  - The authoritative `RESET_GAME` `FULL_ENTITY` dump re-declares BOTH minions with
 *    `tag=ZONE value=GRAVEYARD`. Hearthstone keeps them dead.
 *
 * Bug: the tracker resurrects 42/52 onto the opponent board after the rewind.
 *
 * These helpers parse the expected "must stay dead" entity ids straight from the
 * fixture's GAME_RESET dump, so the spec asserts against fixture-grounded values rather
 * than hardcoded guesses.
 */

/** Entity id of the Decimation copy (CATA_581) that wipes the board and kills 42/52. */
export const DECIMATION_KILLER_ENTITY_ID = 245;

const FULL_ENTITY_HEADER = /FULL_ENTITY - Updating .*\bid=(\d+)\b.*\bplayer=(\d+)\b/;
const GAME_RESET_START = /BLOCK_START BlockType=GAME_RESET\b/;
const BLOCK_END = /-\s*BLOCK_END\s*$/;
const TAG_LINE = /tag=([A-Z0-9_]+) value=([A-Za-z0-9_-]+)/;

interface ResetEntity {
	readonly entityId: number;
	readonly player: number;
	readonly tags: Map<string, string>;
}

/**
 * Parse the FULL_ENTITY records inside the FIRST `BlockType=GAME_RESET` block of the log
 * (the GameState stream copy, which appears before the PowerTaskList copy). Each record
 * exposes its entity id, controlling player and its restored tags.
 */
function parseFirstGameResetEntities(lines: readonly string[]): ResetEntity[] {
	const entities: ResetEntity[] = [];
	let insideReset = false;
	let current: { entityId: number; player: number; tags: Map<string, string> } | null = null;

	const flush = () => {
		if (current != null) {
			entities.push({ entityId: current.entityId, player: current.player, tags: current.tags });
			current = null;
		}
	};

	for (const line of lines) {
		if (!insideReset) {
			if (GAME_RESET_START.test(line)) {
				insideReset = true;
			}
			continue;
		}

		const header = FULL_ENTITY_HEADER.exec(line);
		if (header != null) {
			flush();
			current = { entityId: Number(header[1]), player: Number(header[2]), tags: new Map() };
			continue;
		}

		if (current != null) {
			const tag = TAG_LINE.exec(line);
			if (tag != null) {
				current.tags.set(tag[1], tag[2]);
				continue;
			}
		}

		if (BLOCK_END.test(line)) {
			// First GAME_RESET block closed: stop after collecting its entities.
			flush();
			break;
		}
	}

	flush();
	return entities;
}

/**
 * Entity ids of the opponent's (player 2) minions that the FIRST GAME_RESET re-declares as
 * dead (`ZONE=GRAVEYARD`) AND that Decimation (entity {@link DECIMATION_KILLER_ENTITY_ID})
 * killed. In this fixture that is exactly Vanessa the Ringleader (42) and Demolition
 * Renovator (52) — the minions the tracker must keep in the graveyard after the rewind.
 */
export function getOpponentMinionsKilledByDecimationStillDeadAfterRewind(lines: readonly string[]): number[] {
	const ids = parseFirstGameResetEntities(lines)
		.filter(
			(e) =>
				e.player === 2 &&
				e.tags.get('CARDTYPE') === 'MINION' &&
				e.tags.get('ZONE') === 'GRAVEYARD' &&
				e.tags.get('LAST_AFFECTED_BY') === String(DECIMATION_KILLER_ENTITY_ID),
		)
		.map((e) => e.entityId);
	return Array.from(new Set(ids)).sort((a, b) => a - b);
}

/** True iff the fixture contains a Rewind (`tag=REWIND value=1`) and a GAME_RESET block. */
export function logShowsRewindGameReset(lines: readonly string[]): boolean {
	const sawRewindTag = lines.some((l) => l.includes('tag=REWIND value=1'));
	const sawGameReset = lines.some((l) => GAME_RESET_START.test(l));
	return sawRewindTag && sawGameReset;
}
