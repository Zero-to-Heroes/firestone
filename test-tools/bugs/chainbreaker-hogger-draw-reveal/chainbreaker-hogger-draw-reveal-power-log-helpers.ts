/**
 * Chainbreaker Hogger (JAIL_384)
 * Taunt. Start of Game: Duplicate all other Legendary cards in your deck.
 *
 * The supplied log is replayed in full. These helpers only verify that the expected draw, play,
 * reveal, and copy-link markers remain present.
 */
import { CardIds } from '@firestone-hs/reference-data';
import * as path from 'path';

export const CHAINBREAKER_HOGGER_DRAW_REVEAL_LOG_PATH = path.resolve(__dirname, '../../power.log');

export const HOGGER_CONTROLLER_ID = 1;
export const CHAINBREAKER_HOGGER_ENTITY_ID = 27;
export const ORIGINAL_EGG_ENTITY_ID = 26;
export const HOGGER_GENERATED_EGG_ENTITY_ID = 70;
export const CHAINBREAKER_HOGGER_CARD_ID = CardIds.ChainbreakerHogger_JAIL_384;
export const EGG_OF_KHELOS_CARD_ID = CardIds.TheEggOfKhelos_DINO_410;

const powerTaskListLine = (line: string): boolean => line.includes('PowerTaskList.DebugPrintPower()');
const deckToHandLine = (entityId: number): RegExp =>
	new RegExp(
		`TAG_CHANGE Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${entityId} zone=DECK.*\\] tag=ZONE value=HAND`,
	);
const showEntityLine = (entityId: number): RegExp =>
	new RegExp(`SHOW_ENTITY - Updating Entity=\\[.* id=${entityId} .*\\] CardID=([^\\s]+)`);

export type ChainbreakerHoggerDrawRevealMarkers = {
	readonly hoggerStartOfGameIndex: number;
	readonly generatedEggCreationIndex: number;
	readonly originalEggDrawIndex: number;
	readonly generatedEggDrawIndex: number;
	readonly generatedEggDrawBlockEndIndex: number;
	readonly generatedEggPlayStartIndex: number;
	readonly generatedEggRevealIndex: number;
	readonly generatedEggCopiedFromIndex: number;
	readonly generatedEggPlayEndIndex: number;
	readonly generatedEggCardId: string;
};

export function prepareChainbreakerHoggerDrawRevealLines(raw: string): readonly string[] {
	return raw.split(/\r?\n/);
}

export function parseChainbreakerHoggerDrawRevealMarkers(
	lines: readonly string[],
): ChainbreakerHoggerDrawRevealMarkers {
	const hoggerStartOfGameIndex = lines.findIndex(
		(line) =>
			powerTaskListLine(line) &&
			line.includes('BLOCK_START BlockType=TRIGGER') &&
			line.includes(`id=${CHAINBREAKER_HOGGER_ENTITY_ID} zone=DECK`) &&
			line.includes(`cardId=${CHAINBREAKER_HOGGER_CARD_ID}`) &&
			line.includes('TriggerKeyword=START_OF_GAME_KEYWORD'),
	);
	const generatedEggCreationIndex = lines.findIndex(
		(line, index) =>
			index > hoggerStartOfGameIndex &&
			powerTaskListLine(line) &&
			line.includes(
				`FULL_ENTITY - Updating [entityName=UNKNOWN ENTITY [cardType=INVALID] id=${HOGGER_GENERATED_EGG_ENTITY_ID} zone=DECK`,
			) &&
			line.trimEnd().endsWith('CardID='),
	);
	const originalEggDrawIndex = lines.findIndex(
		(line) => powerTaskListLine(line) && deckToHandLine(ORIGINAL_EGG_ENTITY_ID).test(line),
	);
	const generatedEggDrawIndex = lines.findIndex(
		(line) => powerTaskListLine(line) && deckToHandLine(HOGGER_GENERATED_EGG_ENTITY_ID).test(line),
	);
	const generatedEggDrawBlockEndIndex = lines.findIndex(
		(line, index) => index > generatedEggDrawIndex && powerTaskListLine(line) && line.includes('BLOCK_END'),
	);
	const generatedEggPlayStartIndex = lines.findIndex(
		(line, index) =>
			index > generatedEggDrawBlockEndIndex &&
			powerTaskListLine(line) &&
			line.includes('BLOCK_START BlockType=PLAY') &&
			line.includes(`id=${HOGGER_GENERATED_EGG_ENTITY_ID} zone=HAND`),
	);
	const generatedEggRevealIndex = lines.findIndex(
		(line, index) =>
			index > generatedEggPlayStartIndex &&
			powerTaskListLine(line) &&
			showEntityLine(HOGGER_GENERATED_EGG_ENTITY_ID).test(line),
	);
	const generatedEggCopiedFromIndex = lines.findIndex(
		(line, index) =>
			index > generatedEggRevealIndex &&
			powerTaskListLine(line) &&
			line.includes(`tag=COPIED_FROM_ENTITY_ID value=${ORIGINAL_EGG_ENTITY_ID}`),
	);
	const generatedEggPlayEndIndex = lines.findIndex(
		(line, index) => index > generatedEggCopiedFromIndex && line.includes('PowerProcessor.EndCurrentTaskList()'),
	);
	const generatedEggCardId =
		generatedEggRevealIndex >= 0
			? showEntityLine(HOGGER_GENERATED_EGG_ENTITY_ID).exec(lines[generatedEggRevealIndex])?.[1]
			: undefined;

	const missingMarkers = [
		['Hogger start-of-game block', hoggerStartOfGameIndex],
		['generated Egg creation', generatedEggCreationIndex],
		['original Egg draw', originalEggDrawIndex],
		['generated Egg draw', generatedEggDrawIndex],
		['generated Egg draw block end', generatedEggDrawBlockEndIndex],
		['generated Egg play start', generatedEggPlayStartIndex],
		['generated Egg reveal', generatedEggRevealIndex],
		['generated Egg COPIED_FROM link', generatedEggCopiedFromIndex],
		['generated Egg play end', generatedEggPlayEndIndex],
	].filter(([, index]) => (index as number) < 0);
	if (missingMarkers.length > 0) {
		throw new Error(
			`[chainbreaker-hogger-draw-reveal] Missing fixture markers: ${missingMarkers.map(([name]) => name).join(', ')}`,
		);
	}
	if (
		!(
			hoggerStartOfGameIndex < generatedEggCreationIndex &&
			generatedEggCreationIndex < originalEggDrawIndex &&
			originalEggDrawIndex < generatedEggDrawIndex &&
			generatedEggDrawIndex < generatedEggDrawBlockEndIndex &&
			generatedEggDrawBlockEndIndex < generatedEggPlayStartIndex &&
			generatedEggPlayStartIndex < generatedEggRevealIndex &&
			generatedEggRevealIndex < generatedEggCopiedFromIndex &&
			generatedEggCopiedFromIndex < generatedEggPlayEndIndex
		)
	) {
		throw new Error('[chainbreaker-hogger-draw-reveal] Fixture markers are out of the expected order');
	}
	if (generatedEggCardId !== EGG_OF_KHELOS_CARD_ID) {
		throw new Error(
			`[chainbreaker-hogger-draw-reveal] Expected entity ${HOGGER_GENERATED_EGG_ENTITY_ID} to reveal as ${EGG_OF_KHELOS_CARD_ID}, got ${generatedEggCardId}`,
		);
	}

	return {
		hoggerStartOfGameIndex,
		generatedEggCreationIndex,
		originalEggDrawIndex,
		generatedEggDrawIndex,
		generatedEggDrawBlockEndIndex,
		generatedEggPlayStartIndex,
		generatedEggRevealIndex,
		generatedEggCopiedFromIndex,
		generatedEggPlayEndIndex,
		generatedEggCardId,
	};
}
