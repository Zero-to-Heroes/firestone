/**
 * Parse Moonlit Guidance discover-from-deck from power.log lines.
 *
 * Fixture: Chmielinho#2928 (player 1) vs ПапаОрешник#2254 (player 2). Opponent plays Moonlit
 * Guidance (DED_002), discovers copy entity 150 (ULD_003 / Zephrys) linked to deck entity 48.
 * Playing the copy triggers DED_002e to draw the original (entity 48 DECK→HAND).
 */

import { CardIds } from '@firestone-hs/reference-data';

const ENTITY_CHOICES_MOONLIT =
	/GameState\.DebugPrintEntityChoices\(\) - id=(\d+) Player=.* TaskList=\d+ ChoiceType=GENERAL/;
const ENTITY_CHOICES_SOURCE_MOONLIT = /Source=\[entityName=.* cardId=DED_002 player=(\d+)\]/;
const ENTITIES_CHOSEN = /GameState\.DebugPrintEntitiesChosen\(\) - id=(\d+) Player=/;
const ENTITIES_CHOSEN_ENTITY = /Entities\[0\]=\[entityName=.* id=(\d+) zone=/;
const SHOW_ENTITY_CARD = /SHOW_ENTITY - Updating Entity=\[entityName=.* id=(\d+) zone=.*\] CardID=([A-Z0-9_]+)/;
const COPIED_FROM_ENTITY = /tag=COPIED_FROM_ENTITY_ID value=(\d+)/;
const MOONLIT_ENCHANT_SOURCE =
	/TAG_CHANGE Entity=.* id=152 zone=.* tag=TAG_SCRIPT_DATA_NUM_2 value=(\d+)/;
const MOONLIT_DRAW_TRIGGER =
	/BLOCK_START BlockType=TRIGGER Entity=\[entityName=.* cardId=DED_002e player=\d+\]/;
const DECK_TO_HAND_IN_BLOCK =
	/TAG_CHANGE Entity=\[entityName=.* id=(\d+) zone=DECK zonePos=\d+ cardId=.*\] tag=ZONE value=HAND/;

export const MOONLIT_GUIDANCE_CARD_IDS = [CardIds.MoonlitGuidance_DED_002, CardIds.MoonlitGuidance_PathOfTheMoonEnchantment] as const;

/** Power.log player id of the Moonlit Guidance user (opponent from reporter's perspective). */
export const MOONLIT_OPPONENT_PLAYER_ID = 2;

export type MoonlitGuidanceFixtureCounts = {
	readonly opponentPlayerId: number;
	readonly discoverChoiceId: number;
	readonly pickedCopyEntityId: number;
	readonly sourceDeckEntityId: number;
	readonly pickedCardId: string;
	readonly originalDrawnEntityId: number;
	readonly discoverOptionEntityIds: readonly number[];
};

/**
 * Ground expected Moonlit Guidance outcome in the fixture log (not guessed).
 */
export function parseMoonlitGuidanceFixtureCounts(lines: readonly string[]): MoonlitGuidanceFixtureCounts {
	let discoverChoiceId: number | undefined;
	let opponentPlayerId: number | undefined;
	const discoverOptionEntityIds: number[] = [];

	for (let i = 0; i < lines.length; i++) {
		const source = lines[i].match(ENTITY_CHOICES_SOURCE_MOONLIT);
		if (!source) {
			continue;
		}
		opponentPlayerId = parseInt(source[1], 10);
		for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
			const choice = lines[j].match(ENTITY_CHOICES_MOONLIT);
			if (choice) {
				discoverChoiceId = parseInt(choice[1], 10);
				break;
			}
		}
		for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
			const opt = lines[j].match(/Entities\[\d+\]=\[entityName=.* id=(\d+) zone=SETASIDE/);
			if (opt) {
				discoverOptionEntityIds.push(parseInt(opt[1], 10));
			}
		}
		break;
	}

	if (discoverChoiceId == null || opponentPlayerId == null) {
		throw new Error('[moonlit-guidance] Could not find Moonlit Guidance EntityChoices in fixture log');
	}

	let pickedCopyEntityId: number | undefined;
	for (let i = 0; i < lines.length; i++) {
		const chosen = lines[i].match(ENTITIES_CHOSEN);
		if (!chosen || parseInt(chosen[1], 10) !== discoverChoiceId) {
			continue;
		}
		const entityLine = lines[i + 1]?.match(ENTITIES_CHOSEN_ENTITY);
		if (entityLine) {
			pickedCopyEntityId = parseInt(entityLine[1], 10);
			break;
		}
	}

	if (pickedCopyEntityId == null) {
		throw new Error(`[moonlit-guidance] Could not find EntitiesChosen for choice id=${discoverChoiceId}`);
	}

	let pickedCardId: string | undefined;
	let sourceDeckEntityId: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const show = lines[i].match(SHOW_ENTITY_CARD);
		if (!show || parseInt(show[1], 10) !== pickedCopyEntityId) {
			continue;
		}
		pickedCardId = show[2];
		for (let j = i + 1; j < Math.min(i + 60, lines.length); j++) {
			const copied = lines[j].match(COPIED_FROM_ENTITY);
			if (copied) {
				sourceDeckEntityId = parseInt(copied[1], 10);
				break;
			}
		}
		break;
	}

	if (!pickedCardId) {
		throw new Error(`[moonlit-guidance] Could not resolve SHOW_ENTITY card for copy entity ${pickedCopyEntityId}`);
	}

	if (sourceDeckEntityId == null) {
		for (const line of lines) {
			const m = line.match(MOONLIT_ENCHANT_SOURCE);
			if (m) {
				sourceDeckEntityId = parseInt(m[1], 10);
				break;
			}
		}
	}

	if (sourceDeckEntityId == null) {
		throw new Error('[moonlit-guidance] Could not resolve source deck entity from COPIED_FROM or DED_002e');
	}

	let originalDrawnEntityId: number | undefined;
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].match(MOONLIT_DRAW_TRIGGER)) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
			if (lines[j].includes('BLOCK_END') || lines[j].match(MOONLIT_DRAW_TRIGGER)) {
				break;
			}
			const draw = lines[j].match(DECK_TO_HAND_IN_BLOCK);
			if (draw) {
				originalDrawnEntityId = parseInt(draw[1], 10);
				break;
			}
		}
		if (originalDrawnEntityId != null) {
			break;
		}
	}

	if (originalDrawnEntityId == null) {
		throw new Error('[moonlit-guidance] Could not find DED_002e DECK→HAND draw in fixture log');
	}

	if (originalDrawnEntityId !== sourceDeckEntityId) {
		throw new Error(
			`[moonlit-guidance] Drawn entity ${originalDrawnEntityId} does not match source deck entity ${sourceDeckEntityId}`,
		);
	}

	return {
		opponentPlayerId,
		discoverChoiceId,
		pickedCopyEntityId,
		sourceDeckEntityId,
		pickedCardId,
		originalDrawnEntityId,
		discoverOptionEntityIds,
	};
}
