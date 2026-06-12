/**
 * Parse Commander Geddon / Barren discover-from-deck from power.log lines.
 *
 * Fixture: Logtube#21387 (power.log player 1) vs Theo#2868 (player 2). Opponent plays Geddon
 * (CATA_591); turn-start Barren (CATA_591e) discovers from deck. First discover picks SETASIDE
 * entity 118 (TIME_024 / Murozond); deck entity 20 moves to HAND; other options destroyed.
 */

const GEDDON_ENCHANT = 'CATA_591e';
const GEDDON_MINION = 'CATA_591';

const ENTITY_CHOICES_BARREN =
	/GameState\.DebugPrintEntityChoices\(\) - id=(\d+) Player=.* TaskList=\d+ ChoiceType=GENERAL/;
const ENTITY_CHOICES_SOURCE_BARREN = /Source=\[entityName=.* cardId=CATA_591e player=(\d+)\]/;
const ENTITIES_CHOSEN = /GameState\.DebugPrintEntitiesChosen\(\) - id=(\d+) Player=/;
const ENTITIES_CHOSEN_ENTITY = /Entities\[0\]=\[entityName=.* id=(\d+) zone=/;
const SHOW_ENTITY_CARD = /SHOW_ENTITY - Updating Entity=\[entityName=.* id=(\d+) zone=.*\] CardID=([A-Z0-9_]+)/;
const LINKED_ENTITY = /tag=LINKED_ENTITY value=(\d+)/;
const DECK_TO_HAND = /TAG_CHANGE Entity=\[entityName=.* id=(\d+) zone=DECK zonePos=\d+ cardId=.*\] tag=ZONE value=HAND/;

export const GEDDON_DISCOVER_SOURCE_CARD_IDS = [GEDDON_ENCHANT, GEDDON_MINION] as const;

/** Power.log player id of the Geddon user (opponent from reporter's perspective). */
export const GEDDON_OPPONENT_PLAYER_ID = 1;

export type GeddonDiscoverFixtureCounts = {
	readonly opponentPlayerId: number;
	readonly discoverChoiceId: number;
	readonly pickedSetAsideEntityId: number;
	readonly pickedDeckEntityId: number;
	readonly pickedCardId: string;
	readonly discoverOptionEntityIds: readonly number[];
};

/**
 * Ground expected discover outcome in the fixture log (not guessed).
 */
export function parseGeddonDiscoverFixtureCounts(lines: readonly string[]): GeddonDiscoverFixtureCounts {
	let discoverChoiceId: number | undefined;
	let opponentPlayerId: number | undefined;
	const discoverOptionEntityIds: number[] = [];

	for (let i = 0; i < lines.length; i++) {
		const source = lines[i].match(ENTITY_CHOICES_SOURCE_BARREN);
		if (!source) {
			continue;
		}
		opponentPlayerId = parseInt(source[1], 10);
		for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
			const choice = lines[j].match(ENTITY_CHOICES_BARREN);
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
		throw new Error('[geddon-discover] Could not find Barren EntityChoices in fixture log');
	}

	let pickedSetAsideEntityId: number | undefined;
	for (let i = 0; i < lines.length; i++) {
		const chosen = lines[i].match(ENTITIES_CHOSEN);
		if (!chosen || parseInt(chosen[1], 10) !== discoverChoiceId) {
			continue;
		}
		const entityLine = lines[i + 1]?.match(ENTITIES_CHOSEN_ENTITY);
		if (entityLine) {
			pickedSetAsideEntityId = parseInt(entityLine[1], 10);
			break;
		}
	}

	if (pickedSetAsideEntityId == null) {
		throw new Error(`[geddon-discover] Could not find EntitiesChosen for choice id=${discoverChoiceId}`);
	}

	let pickedCardId: string | undefined;
	let pickedDeckEntityId: number | undefined;

	for (let i = 0; i < lines.length; i++) {
		const show = lines[i].match(SHOW_ENTITY_CARD);
		if (!show || parseInt(show[1], 10) !== pickedSetAsideEntityId) {
			continue;
		}
		pickedCardId = show[2];
		for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
			const linked = lines[j].match(LINKED_ENTITY);
			if (linked) {
				pickedDeckEntityId = parseInt(linked[1], 10);
				break;
			}
		}
		break;
	}

	if (!pickedCardId || pickedDeckEntityId == null) {
		throw new Error(
			`[geddon-discover] Could not resolve picked card for setaside entity ${pickedSetAsideEntityId}`,
		);
	}

	const deckToHandIds: number[] = [];
	for (const line of lines) {
		const m = line.match(DECK_TO_HAND);
		if (m) {
			deckToHandIds.push(parseInt(m[1], 10));
		}
	}
	if (!deckToHandIds.includes(pickedDeckEntityId)) {
		throw new Error(
			`[geddon-discover] Expected deck entity ${pickedDeckEntityId} DECK→HAND in fixture; got ${deckToHandIds}`,
		);
	}

	return {
		opponentPlayerId,
		discoverChoiceId,
		pickedSetAsideEntityId,
		pickedDeckEntityId,
		pickedCardId,
		discoverOptionEntityIds,
	};
}
