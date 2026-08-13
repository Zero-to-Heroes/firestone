/**
 * Fixture-grounded checks for void-counters.log.
 *
 * Local player (Chmielinho, player 2) plays Irida Sinseeker (JAIL_719, entity 142).
 * The remaining deck is sent to SETASIDE / The Void, including Climactic Necrotic
 * Explosion (ETC_210, entity 61).
 */

export const IRIDA_ENTITY_ID = 142;
export const IRIDA_CARD_ID = 'JAIL_719';
export const CNE_ENTITY_ID = 61;
export const CNE_CARD_ID = 'ETC_210';

const GAME_STATE_PREFIX = 'GameState.DebugPrintPower() - ';

/** True iff GameState records player 2 playing Irida (entity 142). */
export function logShowsIridaPlay(lines: readonly string[]): boolean {
	const playNeedle = `BLOCK_START BlockType=PLAY Entity=[entityName=Irida Sinseeker id=${IRIDA_ENTITY_ID} `;
	return lines.some(
		(l) =>
			l.includes(GAME_STATE_PREFIX) && l.includes(playNeedle) && l.includes(`cardId=${IRIDA_CARD_ID} player=2`),
	);
}

/**
 * True iff, inside Irida's GameState POWER block, entity 61 is SHOW_ENTITY'd as
 * ETC_210 with ZONE=SETASIDE (sent to The Void with the rest of the deck).
 */
export function logShowsCneMovedToVoidByIrida(lines: readonly string[]): boolean {
	const powerStart = `BLOCK_START BlockType=POWER Entity=[entityName=Irida Sinseeker id=${IRIDA_ENTITY_ID} `;
	const showNeedle = `SHOW_ENTITY - Updating Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=${CNE_ENTITY_ID} `;
	let inIridaPower = false;
	let inCneShow = false;
	for (const l of lines) {
		if (!l.includes(GAME_STATE_PREFIX)) {
			continue;
		}
		if (!inIridaPower) {
			if (l.includes(powerStart) && l.includes(`cardId=${IRIDA_CARD_ID} player=2`)) {
				inIridaPower = true;
			}
			continue;
		}
		if (l.includes('BLOCK_END')) {
			return false;
		}
		if (!inCneShow) {
			if (l.includes(showNeedle) && l.includes(`CardID=${CNE_CARD_ID}`)) {
				inCneShow = true;
			}
			continue;
		}
		if (l.includes('tag=ZONE value=SETASIDE')) {
			return true;
		}
		if (l.includes('SHOW_ENTITY') || l.includes('FULL_ENTITY') || l.includes('TAG_CHANGE')) {
			return false;
		}
	}
	return false;
}
