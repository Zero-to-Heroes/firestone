/**
 * Opponent plays hidden Hex (entity 58); local player's Hex (entity 23) must stay in deck.
 *
 * Fixture: reqvam#2191 (player 1). Entity 58 is opponent-owned from game start (not stolen).
 */
import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

export const HEX_OPPOSITE_PLAY_POWER_LOG_PATH = path.join(__dirname, 'hex-opposite-play.log');
export const HEX_OPPOSITE_PLAY_TRIMMED_LOG_PATH = path.join(__dirname, 'hex-opposite-play-trimmed.log');

export const LOCAL_PLAYER_NAME = 'reqvam#2191';
export const LOCAL_PLAYER_ID = 1;
export const OPPONENT_HEX_ENTITY_ID = 58;
export const PLAYER_HEX_ENTITY_ID = 23;
export const HEX_CARD_ID = CardIds.HexCore;

/** Minimal Shaman deck: 1× Hex Core + 29× Wisp (mirrors Chronogor fixture pattern). */
export const PLAYER_DECKSTRING = 'AAECAaoIAa+fBAABhQYdAA==';

const OPPONENT_HEX_PLAY_BLOCK = new RegExp(
	`BLOCK_START BlockType=PLAY Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${OPPONENT_HEX_ENTITY_ID} zone=HAND zonePos=\\d+ cardId= player=2\\]`,
);
const SHOW_ENTITY_OPPONENT_HEX = new RegExp(
	`SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${OPPONENT_HEX_ENTITY_ID} zone=HAND.*\\] CardID=${HEX_CARD_ID}`,
);
const OPPONENT_HEX_IN_DECK_AT_START = new RegExp(
	`FULL_ENTITY - Updating \\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${OPPONENT_HEX_ENTITY_ID} zone=DECK zonePos=0 cardId= player=2\\]`,
);
const OPPONENT_HEX_GRAVEYARD = new RegExp(
	`TAG_CHANGE Entity=\\[entityName=Hex id=${OPPONENT_HEX_ENTITY_ID} zone=PLAY zonePos=0 cardId=${HEX_CARD_ID} player=2\\] tag=ZONE value=GRAVEYARD`,
);
const OPPONENT_HEX_SLUSH_AFTER_GRAVEYARD = new RegExp(
	`Info\\[0\\] = \\[entityName=Hex id=${OPPONENT_HEX_ENTITY_ID} zone=GRAVEYARD zonePos=0 cardId=${HEX_CARD_ID} player=2\\]`,
);

export type HexOppositePlayFixtureMarkers = {
	readonly opponentHexPlayLineIndex: number;
	readonly opponentHexEndLineIndex: number;
};

export function parseHexOppositePlayFixtureMarkers(lines: readonly string[]): HexOppositePlayFixtureMarkers {
	let opponentHexPlayLineIndex: number | undefined;
	let opponentHexEndLineIndex: number | undefined;
	let sawOpponentHexGraveyard = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (opponentHexPlayLineIndex == null && OPPONENT_HEX_PLAY_BLOCK.test(line)) {
			opponentHexPlayLineIndex = i;
		}
		if (OPPONENT_HEX_GRAVEYARD.test(line)) {
			sawOpponentHexGraveyard = true;
		}
		if (sawOpponentHexGraveyard && OPPONENT_HEX_SLUSH_AFTER_GRAVEYARD.test(line)) {
			opponentHexEndLineIndex = i;
			break;
		}
	}

	if (opponentHexPlayLineIndex == null) {
		throw new Error(
			`[hex-opposite-play] Could not find opponent Hex PLAY block (entity ${OPPONENT_HEX_ENTITY_ID})`,
		);
	}
	if (opponentHexEndLineIndex == null) {
		throw new Error(
			`[hex-opposite-play] Could not find opponent Hex GRAVEYARD SLUSH_TIME (entity ${OPPONENT_HEX_ENTITY_ID})`,
		);
	}

	const hasShowEntity = lines
		.slice(opponentHexPlayLineIndex, opponentHexPlayLineIndex + 20)
		.some((l) => SHOW_ENTITY_OPPONENT_HEX.test(l));
	if (!hasShowEntity) {
		throw new Error(
			`[hex-opposite-play] Expected SHOW_ENTITY ${HEX_CARD_ID} for entity ${OPPONENT_HEX_ENTITY_ID}`,
		);
	}

	return { opponentHexPlayLineIndex, opponentHexEndLineIndex };
}

export function assertHexOppositePlayAnchorsFromPowerLogLines(lines: readonly string[]): void {
	const joined = lines.join('\n');

	const createGameCount = lines.filter((l) => l.includes('GameState.DebugPrintPower() - CREATE_GAME')).length;
	if (createGameCount !== 1) {
		throw new Error(`[hex-opposite-play] expected exactly one GameState CREATE_GAME, found ${createGameCount}`);
	}
	if (!joined.includes(`PlayerID=1, PlayerName=${LOCAL_PLAYER_NAME}`)) {
		throw new Error(`[hex-opposite-play] expected ${LOCAL_PLAYER_NAME} as PlayerID=1`);
	}
	if (!OPPONENT_HEX_IN_DECK_AT_START.test(joined)) {
		throw new Error(
			`[hex-opposite-play] entity ${OPPONENT_HEX_ENTITY_ID} must start in opponent deck (not stolen)`,
		);
	}
	if (joined.includes(`CONTROLLER_AND_ZONE_CHANGE`) && joined.includes(`id=${OPPONENT_HEX_ENTITY_ID} zone=DECK zonePos=0 cardId= player=1`)) {
		throw new Error(
			`[hex-opposite-play] entity ${OPPONENT_HEX_ENTITY_ID} must not be stolen from local deck`,
		);
	}

	parseHexOppositePlayFixtureMarkers(lines);
}

export function prepareHexOppositePlayFixtureLines(raw: string): readonly string[] {
	return trimPowerLogLinesToLastGame(raw.split(/\r?\n/)).filter((line) => line.length > 0);
}

export function truncateLogLinesBeforeOpponentHexPlay(lines: readonly string[]): readonly string[] {
	const markers = parseHexOppositePlayFixtureMarkers(lines);
	return lines.slice(0, markers.opponentHexPlayLineIndex);
}

export function truncateLogLinesAfterOpponentHexPlay(lines: readonly string[]): readonly string[] {
	const markers = parseHexOppositePlayFixtureMarkers(lines);
	return lines.slice(0, markers.opponentHexEndLineIndex + 1);
}

export function buildHexOppositePlayTrimmedLogContent(fullRaw: string): string {
	const lines = prepareHexOppositePlayFixtureLines(fullRaw);
	return truncateLogLinesAfterOpponentHexPlay(lines).join('\n') + '\n';
}

/** Count Hex rows in the live deck zone (matches deck tracker `quantityInDeck`). */
export function countHexInPlayerDeck(deck: {
	deck: readonly { cardId?: string }[];
}): number {
	return deck.deck.filter((c) => c.cardId === HEX_CARD_ID).length;
}
