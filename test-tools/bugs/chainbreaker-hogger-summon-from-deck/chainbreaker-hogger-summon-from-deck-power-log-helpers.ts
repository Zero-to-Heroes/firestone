/**
 * Chainbreaker Hogger (JAIL_384)
 * Taunt. Start of Game: Duplicate all other Legendary cards in your deck.
 *
 * Fixture: opponent (player 2) runs Hogger; local player is player 1. Hogger creates four
 * anonymous DECK entities; one is drawn/played (Egg), one is summoned DECK→PLAY (Warptooth copy).
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as path from 'path';

export const CHAINBREAKER_HOGGER_SUMMON_FROM_DECK_LOG_PATH = path.resolve(
	__dirname,
	'chainbreaker-hogger-summon-from-deck.log',
);

/** Power.log player id of the Hogger user (opponent from the reporter's perspective). */
export const HOGGER_CONTROLLER_ID = 2;
export const CHAINBREAKER_HOGGER_ENTITY_ID = 49;
export const CHAINBREAKER_HOGGER_CARD_ID = CardIds.ChainbreakerHogger_JAIL_384;
export const WARPTOOTH_CARD_ID = CardIds.Warptooth_JAIL_421;
export const EGG_OF_KHELOS_CARD_ID = CardIds.TheEggOfKhelos_DINO_410;

const FULL_ENTITY_DECK =
	/FULL_ENTITY - Updating \[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+) zone=DECK zonePos=\d+ cardId= player=(\d+)\] CardID=$/;
const DECK_TO_HAND =
	/TAG_CHANGE Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+) zone=DECK zonePos=\d+ cardId=.*\] tag=ZONE value=HAND/;
const SHOW_ENTITY_PLAY = /SHOW_ENTITY - Updating Entity=\[entityName=.* id=(\d+) zone=DECK .*\] CardID=([^\s]+)/;
const CREATOR_TAG = /tag=CREATOR value=(\d+)/;
const ZONE_PLAY_TAG = /tag=ZONE value=PLAY/;

export type ChainbreakerHoggerSummonFromDeckCounts = {
	readonly hoggerEntityId: number;
	readonly createdInDeckEntityIds: readonly number[];
	readonly drawnFromDeckEntityIds: readonly number[];
	readonly summonedFromDeckEntityIds: readonly number[];
	readonly expectedRemainingInDeck: number;
};

/**
 * Ground expected "Created by Hogger" deck counts in the fixture log (not guessed).
 */
export function parseChainbreakerHoggerSummonFromDeckCounts(
	lines: readonly string[],
): ChainbreakerHoggerSummonFromDeckCounts {
	const hoggerStartIndex = lines.findIndex(
		(line) =>
			line.includes('PowerTaskList.DebugPrintPower()') &&
			line.includes('BLOCK_START BlockType=TRIGGER') &&
			line.includes(`id=${CHAINBREAKER_HOGGER_ENTITY_ID} zone=DECK`) &&
			line.includes(`cardId=${CHAINBREAKER_HOGGER_CARD_ID}`) &&
			line.includes('TriggerKeyword=START_OF_GAME_KEYWORD'),
	);
	if (hoggerStartIndex < 0) {
		throw new Error('[chainbreaker-hogger-summon-from-deck] Missing Hogger START_OF_GAME block');
	}

	const hoggerBlockEnd = lines.findIndex(
		(line, index) =>
			index > hoggerStartIndex && line.includes('PowerTaskList.DebugPrintPower()') && line.includes('BLOCK_END'),
	);

	const createdInDeckEntityIds = new Set<number>();
	for (let i = hoggerStartIndex; i < hoggerBlockEnd; i++) {
		const m = lines[i].match(FULL_ENTITY_DECK);
		if (!m) {
			continue;
		}
		const entityId = parseInt(m[1], 10);
		const player = parseInt(m[2], 10);
		if (player === HOGGER_CONTROLLER_ID) {
			createdInDeckEntityIds.add(entityId);
		}
	}

	const drawnFromDeckEntityIds: number[] = [];
	for (const line of lines) {
		const m = line.match(DECK_TO_HAND);
		if (!m) {
			continue;
		}
		const entityId = parseInt(m[1], 10);
		if (createdInDeckEntityIds.has(entityId)) {
			drawnFromDeckEntityIds.push(entityId);
		}
	}

	const summonedFromDeckEntityIds: number[] = [];
	for (let i = 0; i < lines.length; i++) {
		const show = lines[i].match(SHOW_ENTITY_PLAY);
		if (!show) {
			continue;
		}
		const entityId = parseInt(show[1], 10);
		if (!createdInDeckEntityIds.has(entityId)) {
			continue;
		}
		let hasPlayZone = false;
		let creatorIsHogger = false;
		for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
			if (lines[j].includes('SHOW_ENTITY - Updating Entity=')) {
				break;
			}
			if (ZONE_PLAY_TAG.test(lines[j])) {
				hasPlayZone = true;
			}
			const creator = lines[j].match(CREATOR_TAG);
			if (creator && parseInt(creator[1], 10) === CHAINBREAKER_HOGGER_ENTITY_ID) {
				creatorIsHogger = true;
			}
		}
		if (hasPlayZone && creatorIsHogger) {
			summonedFromDeckEntityIds.push(entityId);
		}
	}

	const created = [...createdInDeckEntityIds].sort((a, b) => a - b);
	const drawn = [...new Set(drawnFromDeckEntityIds)].sort((a, b) => a - b);
	const summoned = [...new Set(summonedFromDeckEntityIds)].sort((a, b) => a - b);
	// Drawn copies leave the deck on draw; summoned copies leave on DECK→PLAY (recruit).
	const leftDeck = new Set([...drawn, ...summoned]);

	return {
		hoggerEntityId: CHAINBREAKER_HOGGER_ENTITY_ID,
		createdInDeckEntityIds: created,
		drawnFromDeckEntityIds: drawn,
		summonedFromDeckEntityIds: summoned,
		expectedRemainingInDeck: created.length - leftDeck.size,
	};
}
