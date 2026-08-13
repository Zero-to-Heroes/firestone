/**
 * Parse Fight Over Me (ETC_316) gift markers from the fixture power.log.
 *
 * Card: "Choose two enemy minions. They fight! Add copies of any that die to your hand."
 *
 * In this log the opponent (player 2) plays Fight Over Me (entity 52). Tigress Plushy
 * (id=30, TOY_811) dies; Chronological Drake (id=234, TIME_700t) survives. The copy
 * created in the opponent hand is entity 244 (CardID empty, DISPLAYED_CREATOR=52).
 *
 * PTL plays the hand FULL_ENTITY ~2s before the DEATHS block that moves Tigress to GY.
 * Truncating before that DEATHS block mimics live ClearQueue (oracle runs before GY).
 */

import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const FIGHT_OVER_ME_POWER_LOG_PATH = path.join(__dirname, 'fight-over-me.log');

export const FIGHT_OVER_ME_CARD_ID = CardIds.FightOverMe;
export const FIGHT_OVER_ME_ENTITY_ID = 52;
export const FIGHT_OVER_ME_GIFT_ENTITY_ID = 244;
export const DIED_FIGHTER_ENTITY_ID = 30;
export const DIED_FIGHTER_CARD_ID = CardIds.TigressPlushy_TOY_811;

const PTL_GIFT_FULL_ENTITY =
	/PowerTaskList\.DebugPrintPower\(\) - \s+FULL_ENTITY - Updating \[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=244 zone=HAND/;
const PTL_GIFT_DISPLAYED_CREATOR =
	/PowerTaskList\.DebugPrintPower\(\) - \s+TAG_CHANGE Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=244 zone=HAND.*tag=DISPLAYED_CREATOR value=52/;
const PTL_DEATHS_TIGRESS = /PowerTaskList\.DebugPrintPower\(\) - BLOCK_START BlockType=DEATHS/;
const PTL_TIGRESS_TO_GY =
	/PowerTaskList\.DebugPrintPower\(\) - \s+TAG_CHANGE Entity=\[entityName=Tigress Plushy id=30 .*tag=ZONE value=GRAVEYARD/;

export type FightOverMeFixtureMarkers = {
	readonly ptlGiftFullEntityLineIndex: number;
	readonly ptlGiftDisplayedCreatorLineIndex: number;
	readonly ptlDeathsBlockLineIndex: number;
	readonly ptlTigressToGraveyardLineIndex: number;
};

/**
 * Ground the live-vs-replay cut in the fixture: PTL creates the hand copy, then (later)
 * the DEATHS block moves the dying fighter to GY.
 */
export function parseFightOverMeFixtureMarkers(lines: readonly string[]): FightOverMeFixtureMarkers {
	let ptlGiftFullEntityLineIndex: number | undefined;
	let ptlGiftDisplayedCreatorLineIndex: number | undefined;
	let ptlDeathsBlockLineIndex: number | undefined;
	let ptlTigressToGraveyardLineIndex: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (ptlGiftFullEntityLineIndex == null && PTL_GIFT_FULL_ENTITY.test(line)) {
			ptlGiftFullEntityLineIndex = i;
		}
		if (ptlGiftDisplayedCreatorLineIndex == null && PTL_GIFT_DISPLAYED_CREATOR.test(line)) {
			ptlGiftDisplayedCreatorLineIndex = i;
		}
		if (ptlGiftFullEntityLineIndex != null && ptlDeathsBlockLineIndex == null && PTL_DEATHS_TIGRESS.test(line)) {
			ptlDeathsBlockLineIndex = i;
		}
		if (ptlDeathsBlockLineIndex != null && ptlTigressToGraveyardLineIndex == null && PTL_TIGRESS_TO_GY.test(line)) {
			ptlTigressToGraveyardLineIndex = i;
			break;
		}
	}

	if (
		ptlGiftFullEntityLineIndex == null ||
		ptlGiftDisplayedCreatorLineIndex == null ||
		ptlDeathsBlockLineIndex == null ||
		ptlTigressToGraveyardLineIndex == null
	) {
		throw new Error(
			`[fight-over-me] missing PTL markers: giftFullEntity=${ptlGiftFullEntityLineIndex}, displayedCreator=${ptlGiftDisplayedCreatorLineIndex}, deaths=${ptlDeathsBlockLineIndex}, tigressGy=${ptlTigressToGraveyardLineIndex}`,
		);
	}
	if (!(ptlGiftFullEntityLineIndex < ptlGiftDisplayedCreatorLineIndex)) {
		throw new Error('[fight-over-me] DISPLAYED_CREATOR must follow FULL_ENTITY 244');
	}
	if (!(ptlGiftDisplayedCreatorLineIndex < ptlDeathsBlockLineIndex)) {
		throw new Error('[fight-over-me] PTL DEATHS must come after the hand FULL_ENTITY');
	}
	if (!(ptlDeathsBlockLineIndex < ptlTigressToGraveyardLineIndex)) {
		throw new Error('[fight-over-me] Tigress GY tag must be inside the PTL DEATHS block');
	}

	return {
		ptlGiftFullEntityLineIndex,
		ptlGiftDisplayedCreatorLineIndex,
		ptlDeathsBlockLineIndex,
		ptlTigressToGraveyardLineIndex,
	};
}

/** Prefix that includes the opponent-hand copy but not the PTL DEATHS (live ClearQueue window). */
export function slicePowerLogBeforePtlDeaths(lines: readonly string[]): string[] {
	const markers = parseFightOverMeFixtureMarkers(lines);
	return lines.slice(0, markers.ptlDeathsBlockLineIndex).filter((line) => line.length > 0);
}
