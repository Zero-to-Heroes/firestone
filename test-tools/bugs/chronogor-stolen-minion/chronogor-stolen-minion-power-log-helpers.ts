/**
 * Chronogor steals Concealing Confection (entity 32) from local deck; opponent plays it.
 * Fixture: Chmielinho#2928 (player 1), single-game log in chronogor-stolen-minion.log.
 *
 * Steal/draw must not update local deck (info leak). Deck removal expected only on opponent play.
 */
import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const CHRONOGOR_STOLEN_MINION_POWER_LOG_PATH = path.join(__dirname, 'chronogor-stolen-minion.log');

export const LOCAL_PLAYER_NAME = 'Chmielinho#2928';
export const STOLEN_ENTITY_ID = 32;
export const STOLEN_CARD_ID = CardIds.ConcealingConfection_JAIL_460;
export const CHRONOGOR_CARD_ID = CardIds.Chronogor_TIME_032;

/** Minimal wild deck: 1× Concealing Confection + 29× Wisp (this game never draws/plays another JAIL_460 locally). */
export const PLAYER_DECKSTRING = 'AAECAQseOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzuE6AcAAAA=';

const CHRONOGOR_STEAL_ENTITY = new RegExp(
	`META_DATA - Meta=CONTROLLER_AND_ZONE_CHANGE[\\s\\S]*?id=${STOLEN_ENTITY_ID} zone=DECK`,
);
const OPPONENT_PLAY_STOLEN_MINION = new RegExp(
	`BLOCK_START BlockType=PLAY Entity=\\[entityName=.* id=${STOLEN_ENTITY_ID} zone=HAND`,
);
const REVEAL_CONCEALING_CONFECTION_ON_PLAY = new RegExp(
	`SHOW_ENTITY - Updating Entity=\\[entityName=.* id=${STOLEN_ENTITY_ID} zone=HAND.*\\] CardID=${STOLEN_CARD_ID}`,
);

export function prepareChronogorStolenMinionFixtureLines(raw: string): readonly string[] {
	return raw.split(/\r?\n/).filter((line) => line.length > 0);
}

export function assertChronogorStolenMinionAnchorsFromPowerLogLines(lines: readonly string[]): void {
	const joined = lines.join('\n');

	const createGameCount = lines.filter((l) =>
		l.includes('GameState.DebugPrintPower() - CREATE_GAME'),
	).length;
	if (createGameCount !== 1) {
		throw new Error(
			`[chronogor-stolen-minion] expected exactly one GameState CREATE_GAME, found ${createGameCount}`,
		);
	}
	if (!joined.includes(`PlayerID=1, PlayerName=${LOCAL_PLAYER_NAME}`)) {
		throw new Error(`[chronogor-stolen-minion] expected ${LOCAL_PLAYER_NAME} as PlayerID=1`);
	}
	if (!joined.includes(`CardID=${CHRONOGOR_CARD_ID}`)) {
		throw new Error(`[chronogor-stolen-minion] fixture must contain Chronogor (${CHRONOGOR_CARD_ID})`);
	}
	if (!CHRONOGOR_STEAL_ENTITY.test(joined)) {
		throw new Error(
			`[chronogor-stolen-minion] fixture must contain CONTROLLER_AND_ZONE_CHANGE for entity ${STOLEN_ENTITY_ID}`,
		);
	}
	if (!joined.includes(`Info[2] = ${LOCAL_PLAYER_NAME}`) || !joined.includes('Info[4] = Aleximimus#2584')) {
		throw new Error(
			`[chronogor-stolen-minion] fixture must steal from ${LOCAL_PLAYER_NAME} to opponent via Chronogor`,
		);
	}
	if (!OPPONENT_PLAY_STOLEN_MINION.test(joined)) {
		throw new Error(
			`[chronogor-stolen-minion] fixture must contain opponent PLAY block for entity ${STOLEN_ENTITY_ID}`,
		);
	}
	if (!REVEAL_CONCEALING_CONFECTION_ON_PLAY.test(joined)) {
		throw new Error(
			`[chronogor-stolen-minion] fixture must reveal ${STOLEN_CARD_ID} when opponent plays entity ${STOLEN_ENTITY_ID}`,
		);
	}
}
