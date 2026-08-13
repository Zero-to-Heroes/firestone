/**
 * Tiny Pal (JAIL_458): Battlecry: Choose your elemental ammunition!
 * (After your hero attacks, choose another). Transforms in PLAY via CHANGE_ENTITY.
 *
 * Fixture: local player 1 (reqvam#2191) vs opponent player 2 (XiaoT#11924).
 * Entity 40 is the opponent's Tiny Pal — equipped, transformed (t4/t3/t4), then broken
 * (MAIN_HAND_WEAPON_ENTITY=0, ZONE=GRAVEYARD).
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as path from 'path';

export const TINY_PAL_LOG_PATH = path.join(__dirname, 'tiny-pal.log');

export const TINY_PAL_ENTITY_ID = 40;
export const TINY_PAL_OPPONENT_CONTROLLER = 2;

export const TINY_PAL_CARD_IDS: readonly string[] = [
	CardIds.TinyPal_JAIL_458,
	CardIds.TinyPal_JAIL_458t1,
	CardIds.TinyPal_JAIL_458t2,
	CardIds.TinyPal_JAIL_458t3,
	CardIds.TinyPal_JAIL_458t4,
];

const CHANGE_ENTITY = new RegExp(
	`CHANGE_ENTITY - Updating Entity=\\[entityName=Tiny Pal id=${TINY_PAL_ENTITY_ID} zone=PLAY.* player=${TINY_PAL_OPPONENT_CONTROLLER}\\] CardID=(JAIL_458\\w*)`,
);
const ZONE_GRAVEYARD = new RegExp(
	`TAG_CHANGE Entity=\\[entityName=Tiny Pal id=${TINY_PAL_ENTITY_ID} zone=PLAY.* player=${TINY_PAL_OPPONENT_CONTROLLER}\\] tag=ZONE value=GRAVEYARD`,
);
const WEAPON_CLEARED = /TAG_CHANGE Entity=\S+ tag=MAIN_HAND_WEAPON_ENTITY value=0/;

export type TinyPalFixtureMarkers = {
	readonly entityId: number;
	readonly opponentController: number;
	readonly lastChangeEntityCardId: string;
	readonly lastChangeEntityLineIndex: number;
	readonly graveyardLineIndex: number;
	readonly weaponClearedLineIndex: number;
};

export function isTinyPalCardId(cardId: string | null | undefined): boolean {
	return !!cardId && TINY_PAL_CARD_IDS.includes(cardId);
}

/**
 * Ground Tiny Pal transform + break markers in the fixture log (not guessed).
 */
export function parseTinyPalFixtureMarkers(lines: readonly string[]): TinyPalFixtureMarkers {
	let lastChangeEntityCardId: string | undefined;
	let lastChangeEntityLineIndex: number | undefined;
	let graveyardLineIndex: number | undefined;
	let weaponClearedLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const changeMatch = CHANGE_ENTITY.exec(line);
		if (changeMatch) {
			lastChangeEntityCardId = changeMatch[1];
			lastChangeEntityLineIndex = i;
		}
		if (graveyardLineIndex == null && ZONE_GRAVEYARD.test(line)) {
			graveyardLineIndex = i;
		}
		if (WEAPON_CLEARED.test(line)) {
			weaponClearedLineIndex = i;
		}
	}

	if (lastChangeEntityCardId == null || lastChangeEntityLineIndex == null) {
		throw new Error(
			`[tiny-pal] Could not find CHANGE_ENTITY for entity ${TINY_PAL_ENTITY_ID} player=${TINY_PAL_OPPONENT_CONTROLLER}`,
		);
	}
	if (graveyardLineIndex == null) {
		throw new Error(
			`[tiny-pal] Could not find GRAVEYARD for entity ${TINY_PAL_ENTITY_ID} player=${TINY_PAL_OPPONENT_CONTROLLER}`,
		);
	}
	if (weaponClearedLineIndex == null) {
		throw new Error('[tiny-pal] Could not find MAIN_HAND_WEAPON_ENTITY value=0');
	}

	return {
		entityId: TINY_PAL_ENTITY_ID,
		opponentController: TINY_PAL_OPPONENT_CONTROLLER,
		lastChangeEntityCardId,
		lastChangeEntityLineIndex,
		graveyardLineIndex,
		weaponClearedLineIndex,
	};
}
