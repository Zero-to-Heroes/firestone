/**
 * Dragon Soul, Shattered (CATA_EVENT_110): Start of Game: Break into 6 Essences.
 * Adjoining Essences are cast together.
 *
 * Fixture: local player 2 (Daedin#2991) vs opponent player 1 (DaedinTest#2429).
 * Entity 23 is the opponent's Dragon Soul. Start of Game:
 * - FX dummies 72–77: SHOW_ENTITY as CATA_EVENT_110t2–t7, then ZONE=SETASIDE
 * - Real essences 78–83: FULL_ENTITY in DECK with DISPLAYED_CREATOR=23
 */
import * as path from 'path';
import { CardIds } from '@firestone-hs/reference-data';

export const DRAGON_SOUL_DUP_LOG_PATH = path.join(__dirname, 'dragon-soul-dup.log');

export const DRAGON_SOUL_CARD_ID = CardIds.DragonSoulShattered_CATA_EVENT_110;
export const DRAGON_SOUL_ENTITY_ID = 23;
export const DRAGON_SOUL_OPPONENT_PLAYER_ID = 1;

export const ASPECT_ESSENCE_CARD_IDS: readonly string[] = [
	CardIds.DragonSoulShattered_RedAspectEssenceToken_CATA_EVENT_110t2,
	CardIds.DragonSoulShattered_BlueAspectEssenceToken_CATA_EVENT_110t3,
	CardIds.DragonSoulShattered_BronzeAspectEssenceToken_CATA_EVENT_110t4,
	CardIds.DragonSoulShattered_BlackAspectEssenceToken_CATA_EVENT_110t5,
	CardIds.DragonSoulShattered_GreenAspectEssenceToken_CATA_EVENT_110t6,
	CardIds.DragonSoulShattered_StormAspectEssenceToken_CATA_EVENT_110t7,
];

const PTL = 'PowerTaskList\\.DebugPrintPower\\(\\)';

const FX_SHOW_ENTITY = new RegExp(
	`${PTL} -\\s+SHOW_ENTITY - Updating Entity=\\[entityName=.* id=(\\d+) zone=DECK.* player=${DRAGON_SOUL_OPPONENT_PLAYER_ID}\\] CardID=(CATA_EVENT_110t[2-7])`,
);

const FX_SETASIDE = (entityId: number) =>
	new RegExp(
		`${PTL} -\\s+TAG_CHANGE Entity=\\[entityName=.* id=${entityId} zone=DECK.* player=${DRAGON_SOUL_OPPONENT_PLAYER_ID}\\] tag=ZONE value=SETASIDE`,
	);

const REAL_FULL_ENTITY = new RegExp(
	`${PTL} -\\s+FULL_ENTITY - Updating \\[entityName=.* id=(\\d+) zone=DECK.* player=${DRAGON_SOUL_OPPONENT_PLAYER_ID}\\] CardID=`,
);

const DISPLAYED_CREATOR = (entityId: number) =>
	new RegExp(
		`${PTL} -\\s+TAG_CHANGE Entity=\\[entityName=.* id=${entityId} zone=DECK.* player=${DRAGON_SOUL_OPPONENT_PLAYER_ID}\\] tag=DISPLAYED_CREATOR value=${DRAGON_SOUL_ENTITY_ID}`,
	);

export type FxDummyEssence = {
	readonly entityId: number;
	readonly cardId: string;
	readonly showEntityLineIndex: number;
	readonly setAsideLineIndex: number;
};

export type RealEssence = {
	readonly entityId: number;
	readonly fullEntityLineIndex: number;
	readonly displayedCreatorLineIndex: number;
};

export type DragonSoulDupFixtureMarkers = {
	readonly fxDummyEssences: readonly FxDummyEssence[];
	readonly realEssences: readonly RealEssence[];
};

/**
 * Ground Dragon Soul SoG dummy FX + real deck-essence markers in the fixture (not guessed).
 */
export function parseDragonSoulDupFixtureMarkers(lines: readonly string[]): DragonSoulDupFixtureMarkers {
	const fxDummyEssences: FxDummyEssence[] = [];
	const seenFxCardIds = new Set<string>();

	for (let i = 0; i < lines.length; i++) {
		const showMatch = FX_SHOW_ENTITY.exec(lines[i]);
		if (!showMatch) {
			continue;
		}
		const entityId = parseInt(showMatch[1], 10);
		const cardId = showMatch[2];
		if (seenFxCardIds.has(cardId)) {
			continue;
		}
		let setAsideLineIndex: number | undefined;
		for (let j = i + 1; j < Math.min(lines.length, i + 30); j++) {
			if (FX_SETASIDE(entityId).test(lines[j])) {
				setAsideLineIndex = j;
				break;
			}
		}
		if (setAsideLineIndex == null) {
			throw new Error(`[dragon-soul-dup] No SETASIDE after FX SHOW_ENTITY for entity ${entityId} (${cardId})`);
		}
		seenFxCardIds.add(cardId);
		fxDummyEssences.push({
			entityId,
			cardId,
			showEntityLineIndex: i,
			setAsideLineIndex,
		});
	}

	const lastFxLine = fxDummyEssences.length > 0 ? fxDummyEssences[fxDummyEssences.length - 1].setAsideLineIndex : -1;
	const realEssences: RealEssence[] = [];

	for (let i = lastFxLine + 1; i < lines.length; i++) {
		const fullMatch = REAL_FULL_ENTITY.exec(lines[i]);
		if (!fullMatch) {
			continue;
		}
		const entityId = parseInt(fullMatch[1], 10);
		let displayedCreatorLineIndex: number | undefined;
		for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
			if (DISPLAYED_CREATOR(entityId).test(lines[j])) {
				displayedCreatorLineIndex = j;
				break;
			}
			if (lines[j].includes('FULL_ENTITY')) {
				break;
			}
		}
		if (displayedCreatorLineIndex == null) {
			continue;
		}
		realEssences.push({
			entityId,
			fullEntityLineIndex: i,
			displayedCreatorLineIndex,
		});
	}

	return { fxDummyEssences, realEssences };
}
