/**
 * Parse Prince Malchezaar (KAR_096) deck tokens from power.log lines.
 *
 * In the fixture the opponent runs Malchezaar (power.log player 1, Ronk#2579); the local
 * player is player 2 (Chmielinho#2928). Malchezaar adds 5 legendaries per copy via
 * FULL_ENTITY in DECK with DISPLAYED_CREATOR pointing at a SETASIDE KAR_096 entity.
 */

const MALCHEZAAR = 'KAR_096';

/** Power.log player id of the Malchezaar user (opponent from the reporter's perspective). */
export const MALCHEZAAR_OPPONENT_PLAYER_ID = 1;
const FULL_ENTITY_DECK = /FULL_ENTITY - Updating \[entityName=.* id=(\d+) zone=DECK zonePos=\d+ cardId= player=(\d+)\]/;
const DISPLAYED_CREATOR = /tag=DISPLAYED_CREATOR value=(\d+)/;
const SETASIDE_MALCHEZAAR = /SHOW_ENTITY - Updating Entity=\[entityName=.* id=(\d+) zone=SETASIDE.*CardID=KAR_096/;
const DECK_TO_HAND = /TAG_CHANGE Entity=\[entityName=.* id=(\d+) zone=DECK zonePos=\d+ cardId=.*\] tag=ZONE value=HAND/;

export type MalchezaarDeckFixtureCounts = {
	readonly malchezaarSetAsideEntityIds: readonly number[];
	readonly createdInDeckEntityIds: readonly number[];
	readonly drawnFromDeckEntityIds: readonly number[];
	readonly expectedRemainingInDeck: number;
};

/**
 * Ground expected deck counts in the fixture log (not guessed).
 */
export function parseMalchezaarDeckFixtureCounts(lines: readonly string[]): MalchezaarDeckFixtureCounts {
	const malchezaarSetAsideEntityIds = new Set<number>();
	for (const line of lines) {
		const m = line.match(SETASIDE_MALCHEZAAR);
		if (m) {
			malchezaarSetAsideEntityIds.add(parseInt(m[1], 10));
		}
	}

	const createdInDeckEntityIds = new Set<number>();
	for (let i = 0; i < lines.length; i++) {
		const fullEntity = lines[i].match(FULL_ENTITY_DECK);
		if (!fullEntity) {
			continue;
		}
		const entityId = parseInt(fullEntity[1], 10);
		const player = parseInt(fullEntity[2], 10);
		if (player !== MALCHEZAAR_OPPONENT_PLAYER_ID) {
			continue;
		}
		for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
			const creator = lines[j].match(DISPLAYED_CREATOR);
			if (creator) {
				const creatorId = parseInt(creator[1], 10);
				if (malchezaarSetAsideEntityIds.has(creatorId)) {
					createdInDeckEntityIds.add(entityId);
				}
				break;
			}
			if (lines[j].includes('FULL_ENTITY')) {
				break;
			}
		}
	}

	const drawnFromDeckEntityIds: number[] = [];
	for (const line of lines) {
		const m = line.match(DECK_TO_HAND);
		if (m) {
			const entityId = parseInt(m[1], 10);
			if (createdInDeckEntityIds.has(entityId)) {
				drawnFromDeckEntityIds.push(entityId);
			}
		}
	}

	const created = [...createdInDeckEntityIds].sort((a, b) => a - b);
	const drawn = [...new Set(drawnFromDeckEntityIds)].sort((a, b) => a - b);

	return {
		malchezaarSetAsideEntityIds: [...malchezaarSetAsideEntityIds].sort((a, b) => a - b),
		createdInDeckEntityIds: created,
		drawnFromDeckEntityIds: drawn,
		expectedRemainingInDeck: created.length - drawn.length,
	};
}

export const MALCHEZAAR_CREATOR_CARD_ID = MALCHEZAAR;
