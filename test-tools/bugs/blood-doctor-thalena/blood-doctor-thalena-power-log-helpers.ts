/**
 * Parse hero power entities from blood-doctor-thalena.log for board-zone regression tests.
 */

export interface HeroPowerFixtureRef {
	readonly entityId: number;
	readonly cardId: string;
}

const FULL_ENTITY_ID_RE = /FULL_ENTITY - (?:Creating|Updating) ID=(\d+)/;
const CARD_ID_RE = /CardID=(\S+)/;
const ENTITY_ID_TAG_RE = /tag=ENTITY_ID value=(\d+)/;
const CONTROLLER_TAG_RE = /tag=CONTROLLER value=(\d+)/;
const CARDTYPE_HERO_POWER_RE = /tag=CARDTYPE value=HERO_POWER/;
const ADDITIONAL_HERO_POWER_INDEX_RE = /tag=ADDITIONAL_HERO_POWER_INDEX value=(\d+)/;

function parseHeroPowerBlock(
	lines: readonly string[],
	startIndex: number,
): { entityId: number; cardId: string; controller: number; additionalIndex: number | null } | null {
	let entityId: number | null = null;
	let cardId: string | null = null;
	let controller: number | null = null;
	let additionalIndex: number | null = null;

	for (let i = startIndex; i < Math.min(startIndex + 30, lines.length); i++) {
		const line = lines[i];
		if (i > startIndex && FULL_ENTITY_ID_RE.test(line)) {
			break;
		}
		const idFromHeader = line.match(FULL_ENTITY_ID_RE);
		if (idFromHeader) {
			entityId = parseInt(idFromHeader[1], 10);
		}
		const cardIdMatch = line.match(CARD_ID_RE);
		if (cardIdMatch) {
			cardId = cardIdMatch[1];
		}
		const entityIdTag = line.match(ENTITY_ID_TAG_RE);
		if (entityIdTag) {
			entityId = parseInt(entityIdTag[1], 10);
		}
		const controllerMatch = line.match(CONTROLLER_TAG_RE);
		if (controllerMatch) {
			controller = parseInt(controllerMatch[1], 10);
		}
		const additionalMatch = line.match(ADDITIONAL_HERO_POWER_INDEX_RE);
		if (additionalMatch) {
			additionalIndex = parseInt(additionalMatch[1], 10);
		}
	}

	if (entityId == null || !cardId || controller == null) {
		return null;
	}
	return { entityId, cardId, controller, additionalIndex };
}

/**
 * Primary hero power for controller 2 at game setup (Ghoul Charge, entity 67).
 */
export function extractPrimaryHeroPowerFromPowerLogLines(lines: readonly string[]): HeroPowerFixtureRef | null {
	for (let i = 0; i < lines.length; i++) {
		if (!FULL_ENTITY_ID_RE.test(lines[i]) || !lines[i].includes('ID=67')) {
			continue;
		}
		const block = parseHeroPowerBlock(lines, i);
		if (block?.controller === 2 && block.additionalIndex !== 1) {
			return { entityId: block.entityId, cardId: block.cardId };
		}
	}
	return null;
}

/**
 * Additional hero power granted by Blood Doctor Thal'ena (Vampyr's Kiss, entity 100).
 */
export function extractAdditionalHeroPowerFromPowerLogLines(lines: readonly string[]): HeroPowerFixtureRef | null {
	for (let i = 0; i < lines.length; i++) {
		if (!FULL_ENTITY_ID_RE.test(lines[i])) {
			continue;
		}
		const window = lines.slice(i, Math.min(i + 30, lines.length)).join('\n');
		if (!CARDTYPE_HERO_POWER_RE.test(window) || !ADDITIONAL_HERO_POWER_INDEX_RE.test(window)) {
			continue;
		}
		const block = parseHeroPowerBlock(lines, i);
		if (block?.controller === 2 && block.additionalIndex === 1) {
			return { entityId: block.entityId, cardId: block.cardId };
		}
	}
	return null;
}
