/**
 * Fixture-grounded checks for untimely-death-secret.log.
 *
 * Opponent (player 2) plays unknown Hunter secret entity 148 on game turn 14.
 * Sketchy Stranger (entity 143) is played that turn and dies on game turn 15
 * (`NUM_TURNS_IN_PLAY` 1) without a SECRET trigger on 148 — Untimely Death's window.
 */

/** Unknown Hunter secret the opponent played from Sketchy Stranger's discover. */
export const HUNTER_SECRET_ENTITY_ID = 148;

/** Sketchy Stranger, played game turn 14, died game turn 15. */
export const SKETCHY_STRANGER_ENTITY_ID = 143;

/** True iff entity 148 entered ZONE=SECRET with CLASS=HUNTER. */
export function logShowsEntity148EnteringSecretAsHunter(lines: readonly string[]): boolean {
	let sawSecretZone = false;
	let sawHunterClass = false;
	const needle = `id=${HUNTER_SECRET_ENTITY_ID} `;
	for (const l of lines) {
		if (!l.includes(needle)) continue;
		if (l.includes('tag=ZONE value=SECRET')) sawSecretZone = true;
		if (l.includes('tag=CLASS value=HUNTER')) sawHunterClass = true;
		if (sawSecretZone && sawHunterClass) return true;
	}
	return false;
}

/**
 * True iff Sketchy Stranger 143 has a PLAY from hand, then a GameEntity TURN change,
 * then ZONE=GRAVEYARD — i.e. it died the turn after being played.
 */
export function logShowsSketchyStrangerDiedTheTurnAfterPlay(lines: readonly string[]): boolean {
	const playNeedle = `id=${SKETCHY_STRANGER_ENTITY_ID} zone=HAND`;
	const deathNeedle = `id=${SKETCHY_STRANGER_ENTITY_ID} zone=PLAY zonePos=`;
	let sawPlay = false;
	let sawTurnAfterPlay = false;
	for (const l of lines) {
		if (!sawPlay && l.includes('BLOCK_START BlockType=PLAY') && l.includes(playNeedle)) {
			sawPlay = true;
			continue;
		}
		if (sawPlay && !sawTurnAfterPlay && l.includes('TAG_CHANGE Entity=GameEntity tag=TURN value=')) {
			sawTurnAfterPlay = true;
			continue;
		}
		if (sawTurnAfterPlay && l.includes(deathNeedle) && l.includes('tag=ZONE value=GRAVEYARD')) {
			return true;
		}
	}
	return false;
}

/** True iff entity 148 never fires a SECRET trigger in this fixture. */
export function logShowsNoSecretTriggerOnEntity148(lines: readonly string[]): boolean {
	const needle = `id=${HUNTER_SECRET_ENTITY_ID} `;
	return !lines.some(
		(l) => l.includes('BLOCK_START BlockType=TRIGGER') && l.includes(needle) && l.includes('TriggerKeyword=SECRET'),
	);
}
