/**
 * Parse opponent Tracking's private discover-from-deck choice from the reporter power.log.
 *
 * Tracking (CORE_DS1_184): "Discover a card from your deck."
 * DaedinTest (player 2) chooses SETASIDE entity 139, revealed only in the log as TIME_609t2.
 * COPIED_FROM_ENTITY_ID links that preview to deck entity 62, which then moves to HAND.
 */

const ENTITY_CHOICES_TRACKING =
	/GameState\.DebugPrintEntityChoices\(\) - id=(\d+) Player=.* TaskList=\d+ ChoiceType=GENERAL/;
const ENTITY_CHOICES_SOURCE_TRACKING =
	/Source=\[entityName=Tracking id=\d+ zone=PLAY zonePos=\d+ cardId=CORE_DS1_184 player=(\d+)\]/;
const ENTITIES_CHOSEN = /GameState\.DebugPrintEntitiesChosen\(\) - id=(\d+) Player=/;
const ENTITIES_CHOSEN_ENTITY = /Entities\[0\]=\[entityName=.* id=(\d+) zone=/;
const SHOW_ENTITY_CARD = /SHOW_ENTITY - Updating Entity=\[entityName=.* id=(\d+) zone=.*\] CardID=([A-Za-z0-9_]+)/;
const COPIED_FROM_ENTITY = /tag=COPIED_FROM_ENTITY_ID value=(\d+)/;
const DECK_TO_HAND = /TAG_CHANGE Entity=\[entityName=.* id=(\d+) zone=DECK zonePos=\d+ cardId=.*\] tag=ZONE value=HAND/;

export type TrackingOpponentFixture = {
	readonly opponentPlayerId: number;
	readonly discoverChoiceId: number;
	readonly discoverOptionEntityIds: readonly number[];
	readonly pickedSetAsideEntityId: number;
	readonly pickedDeckEntityId: number;
	readonly pickedCardId: string;
};

export function parseTrackingOpponentFixture(lines: readonly string[]): TrackingOpponentFixture {
	let discoverChoiceId: number | undefined;
	let opponentPlayerId: number | undefined;
	const discoverOptionEntityIds: number[] = [];

	for (let i = 0; i < lines.length; i++) {
		const source = lines[i].match(ENTITY_CHOICES_SOURCE_TRACKING);
		if (!source) {
			continue;
		}
		opponentPlayerId = parseInt(source[1], 10);
		for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
			const choice = lines[j].match(ENTITY_CHOICES_TRACKING);
			if (choice) {
				discoverChoiceId = parseInt(choice[1], 10);
				break;
			}
		}
		for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
			const option = lines[j].match(/Entities\[\d+\]=\[entityName=.* id=(\d+) zone=SETASIDE/);
			if (option) {
				discoverOptionEntityIds.push(parseInt(option[1], 10));
			}
		}
		break;
	}

	if (discoverChoiceId == null || opponentPlayerId == null) {
		throw new Error('[tracking-opponent] Could not find Tracking EntityChoices in fixture log');
	}

	let pickedSetAsideEntityId: number | undefined;
	for (let i = 0; i < lines.length; i++) {
		const chosen = lines[i].match(ENTITIES_CHOSEN);
		if (!chosen || parseInt(chosen[1], 10) !== discoverChoiceId) {
			continue;
		}
		const picked = lines[i + 1]?.match(ENTITIES_CHOSEN_ENTITY);
		if (picked) {
			pickedSetAsideEntityId = parseInt(picked[1], 10);
			break;
		}
	}

	if (pickedSetAsideEntityId == null) {
		throw new Error(`[tracking-opponent] Could not find chosen entity for choice id=${discoverChoiceId}`);
	}

	let pickedCardId: string | undefined;
	let pickedDeckEntityId: number | undefined;
	for (let i = 0; i < lines.length; i++) {
		const shown = lines[i].match(SHOW_ENTITY_CARD);
		if (!shown || parseInt(shown[1], 10) !== pickedSetAsideEntityId) {
			continue;
		}
		pickedCardId = shown[2];
		for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
			const copiedFrom = lines[j].match(COPIED_FROM_ENTITY);
			if (copiedFrom) {
				pickedDeckEntityId = parseInt(copiedFrom[1], 10);
				break;
			}
		}
		break;
	}

	if (!pickedCardId || pickedDeckEntityId == null) {
		throw new Error(
			`[tracking-opponent] Could not resolve copied deck entity for chosen SETASIDE entity ${pickedSetAsideEntityId}`,
		);
	}

	const movedToHand = lines.some((line) => {
		const match = line.match(DECK_TO_HAND);
		return match != null && parseInt(match[1], 10) === pickedDeckEntityId;
	});
	if (!movedToHand) {
		throw new Error(`[tracking-opponent] Expected deck entity ${pickedDeckEntityId} to move DECK → HAND`);
	}

	return {
		opponentPlayerId,
		discoverChoiceId,
		discoverOptionEntityIds,
		pickedSetAsideEntityId,
		pickedDeckEntityId,
		pickedCardId,
	};
}
