/**
 * Parse Rustrot Viper (CORE_SW_072) deck-tracking markers from power.log lines.
 *
 * Fixture: Chmielinho#2928 (local player 2) vs VIRUS#2191 (opponent player 1).
 * Entity 21 is the opponent's Rustrot Viper — drawn, traded back to deck, re-drawn, played.
 */

import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const RUSTROT_VIPER_POWER_LOG_PATH = path.join(__dirname, 'rustrot-viper.log');

export const RUSTROT_VIPER_ENTITY_ID = 21;
export const RUSTROT_VIPER_CARD_ID = CardIds.RustrotViperCore;
export const OPPONENT_CONTROLLER = 1;

const TRADE_REVEAL = new RegExp(
	`SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${RUSTROT_VIPER_ENTITY_ID} zone=HAND.*\\] CardID=${RUSTROT_VIPER_CARD_ID}`,
);
const PLAY_FROM_HAND = new RegExp(
	`BLOCK_START BlockType=PLAY Entity=\\[entityName=.* id=${RUSTROT_VIPER_ENTITY_ID} zone=HAND.* player=${OPPONENT_CONTROLLER}\\]`,
);
const ZONE_GRAVEYARD = new RegExp(
	`TAG_CHANGE Entity=\\[entityName=.* id=${RUSTROT_VIPER_ENTITY_ID} zone=PLAY.* player=${OPPONENT_CONTROLLER}\\] tag=ZONE value=GRAVEYARD`,
);

export type RustrotViperFixtureMarkers = {
	readonly viperEntityId: number;
	readonly viperCardId: string;
	readonly tradeRevealLineIndex: number;
	readonly playFromHandLineIndex: number;
	readonly graveyardLineIndex: number;
};

/**
 * Ground Rustrot Viper lifecycle markers in the fixture log (not guessed).
 */
export function parseRustrotViperFixtureMarkers(lines: readonly string[]): RustrotViperFixtureMarkers {
	let tradeRevealLineIndex: number | undefined;
	let playFromHandLineIndex: number | undefined;
	let graveyardLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (tradeRevealLineIndex == null && TRADE_REVEAL.test(line)) {
			tradeRevealLineIndex = i;
		}
		if (playFromHandLineIndex == null && PLAY_FROM_HAND.test(line)) {
			playFromHandLineIndex = i;
		}
		if (graveyardLineIndex == null && ZONE_GRAVEYARD.test(line)) {
			graveyardLineIndex = i;
		}
	}

	if (tradeRevealLineIndex == null) {
		throw new Error(
			`[rustrot-viper] Could not find trade SHOW_ENTITY for entity ${RUSTROT_VIPER_ENTITY_ID} CardID=${RUSTROT_VIPER_CARD_ID}`,
		);
	}
	if (playFromHandLineIndex == null) {
		throw new Error(
			`[rustrot-viper] Could not find PLAY from hand for entity ${RUSTROT_VIPER_ENTITY_ID} player=${OPPONENT_CONTROLLER}`,
		);
	}
	if (graveyardLineIndex == null) {
		throw new Error(
			`[rustrot-viper] Could not find GRAVEYARD for entity ${RUSTROT_VIPER_ENTITY_ID} player=${OPPONENT_CONTROLLER}`,
		);
	}

	return {
		viperEntityId: RUSTROT_VIPER_ENTITY_ID,
		viperCardId: RUSTROT_VIPER_CARD_ID,
		tradeRevealLineIndex,
		playFromHandLineIndex,
		graveyardLineIndex,
	};
}
