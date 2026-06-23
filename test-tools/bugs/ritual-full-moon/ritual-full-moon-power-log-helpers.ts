/**
 * Parse Ritual of the Full Moon copy/replay plays from power.log lines.
 *
 * Fixture: Razor#21494 (player 2). Copied ritual token EDR_461t appears via Ashamane (entity 130)
 * and Conniving Conman replay (entity 219). Collectible deck card is EDR_461 (New Moon).
 */

import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

export const RITUAL_TOKEN_ID = CardIds.RitualOfTheNewMoon_RitualOfTheFullMoonToken_EDR_461t;

/** Ashamane copy of opponent ritual — first copied play in fixture. */
export const ASHAMANE_RITUAL_ENTITY_ID = 130;

/** Conniving Conman replay of last cross-class spell — second ritual play in fixture. */
export const CONMAN_RITUAL_ENTITY_ID = 219;

/** Local player in reporter log (Razor#21494). */
export const LOCAL_PLAYER_ID = 2;

const CREATE_GAME_PLAYER = /Player EntityID=\d+ PlayerID=(\d+)/;
const FIRST_RITUAL_PLAY_BLOCK = new RegExp(
	`BLOCK_START BlockType=PLAY Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${ASHAMANE_RITUAL_ENTITY_ID} zone=HAND`,
);
const SHOW_ENTITY_RITUAL = new RegExp(
	`SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${ASHAMANE_RITUAL_ENTITY_ID} zone=HAND.*\\] CardID=${RITUAL_TOKEN_ID}`,
);
const ENTITY_219_GRAVEYARD = new RegExp(
	`TAG_CHANGE Entity=\\[entityName=Ritual of the Full Moon id=${CONMAN_RITUAL_ENTITY_ID} zone=PLAY zonePos=0 cardId=${RITUAL_TOKEN_ID} player=${LOCAL_PLAYER_ID}\\] tag=ZONE value=GRAVEYARD`,
);

export type RitualFullMoonFixtureMarkers = {
	readonly localPlayerId: number;
	readonly ashamaneRitualEntityId: number;
	readonly conmanRitualEntityId: number;
	readonly ritualTokenId: string;
	readonly firstRitualPlayLineIndex: number;
	readonly conmanRitualEndLineIndex: number;
};

/**
 * Ground ritual play markers in the fixture log (not guessed).
 */
export function parseRitualFullMoonFixtureMarkers(lines: readonly string[]): RitualFullMoonFixtureMarkers {
	let localPlayerId: number | undefined;
	let firstRitualPlayLineIndex: number | undefined;
	let conmanRitualEndLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (localPlayerId == null && line.includes('CREATE_GAME')) {
			const playerIds: number[] = [];
			for (let j = i; j < Math.min(i + 40, lines.length); j++) {
				const player = lines[j].match(CREATE_GAME_PLAYER);
				if (player) {
					playerIds.push(parseInt(player[1], 10));
				}
				if (playerIds.length >= 2) {
					break;
				}
			}
			// Reporter (Razor#21494) is the second player block in CREATE_GAME.
			localPlayerId = playerIds[1];
		}
		if (firstRitualPlayLineIndex == null && FIRST_RITUAL_PLAY_BLOCK.test(line)) {
			firstRitualPlayLineIndex = i;
		}
		if (ENTITY_219_GRAVEYARD.test(line)) {
			conmanRitualEndLineIndex = i;
		}
	}

	if (localPlayerId == null) {
		throw new Error('[ritual-full-moon] Could not find local player id in CREATE_GAME');
	}
	if (firstRitualPlayLineIndex == null) {
		throw new Error(`[ritual-full-moon] Could not find Ashamane ritual PLAY block (entity ${ASHAMANE_RITUAL_ENTITY_ID})`);
	}
	if (conmanRitualEndLineIndex == null) {
		throw new Error(`[ritual-full-moon] Could not find Conman ritual GRAVEYARD (entity ${CONMAN_RITUAL_ENTITY_ID})`);
	}

	const hasShowEntity = lines
		.slice(firstRitualPlayLineIndex, firstRitualPlayLineIndex + 20)
		.some((l) => SHOW_ENTITY_RITUAL.test(l));
	if (!hasShowEntity) {
		throw new Error(`[ritual-full-moon] Expected SHOW_ENTITY ${RITUAL_TOKEN_ID} for entity ${ASHAMANE_RITUAL_ENTITY_ID}`);
	}

	return {
		localPlayerId,
		ashamaneRitualEntityId: ASHAMANE_RITUAL_ENTITY_ID,
		conmanRitualEntityId: CONMAN_RITUAL_ENTITY_ID,
		ritualTokenId: RITUAL_TOKEN_ID,
		firstRitualPlayLineIndex,
		conmanRitualEndLineIndex,
	};
}

/** Lines through Conman ritual replay resolution (fixture file is already truncated here). */
export function truncateLogLinesToCutoff(lines: readonly string[]): readonly string[] {
	const markers = parseRitualFullMoonFixtureMarkers(lines);
	return lines.slice(0, markers.conmanRitualEndLineIndex + 1);
}

/** Lines immediately before the first copied Ritual of the Full Moon play (entity 130). */
export function truncateLogLinesBeforeFirstRitualPlay(lines: readonly string[]): readonly string[] {
	const markers = parseRitualFullMoonFixtureMarkers(lines);
	return lines.slice(0, markers.firstRitualPlayLineIndex);
}

/** Trim to last game, then apply fixture cutoff. */
export function prepareRitualFullMoonFixtureLines(raw: string): readonly string[] {
	const lastGame = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
	return truncateLogLinesToCutoff(lastGame);
}
