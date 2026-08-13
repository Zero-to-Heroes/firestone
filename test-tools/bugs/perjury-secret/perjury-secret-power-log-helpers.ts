/**
 * Fixture-grounded checks for perjury-secret.log.
 *
 * Paladin opponent (player 2) plays Observer of Mysteries, which casts two unknown
 * secrets. At the start of their next turn, entity 158 reveals as Perjury (MAW_018)
 * and discovers a secret from another class. The chosen option (entity 173) enters
 * SECRET as CLASS=ROGUE COST=2 — still hidden. Perjury cannot discover/cast itself,
 * so 173 must not be offered as Perjury in the secret helper.
 */

/** Observer-cast Perjury that triggers and starts the discover. */
export const PERJURY_TRIGGER_ENTITY_ID = 158;

/** Hidden Rogue 2-cost secret Perjury discovers and casts. */
export const PERJURY_CREATED_SECRET_ENTITY_ID = 173;

/** True iff entity 158 SHOW_ENTITY as Perjury and then SECRET-triggers. */
export function logShowsPerjuryTriggered(lines: readonly string[]): boolean {
	const showNeedle = `id=${PERJURY_TRIGGER_ENTITY_ID} `;
	let sawPerjuryShow = false;
	for (const l of lines) {
		if (!sawPerjuryShow && l.includes('SHOW_ENTITY') && l.includes(showNeedle) && l.includes('CardID=MAW_018')) {
			sawPerjuryShow = true;
			continue;
		}
		if (
			sawPerjuryShow &&
			l.includes('BLOCK_START BlockType=TRIGGER') &&
			l.includes(`id=${PERJURY_TRIGGER_ENTITY_ID} `) &&
			l.includes('TriggerKeyword=SECRET')
		) {
			return true;
		}
	}
	return false;
}

/**
 * True iff entity 173 is moved into ZONE=SECRET with CLASS=ROGUE and COST=2
 * (the hidden Perjury discover pick) and is never SHOW_ENTITY'd with a CardID.
 */
export function logShowsEntity173EnteringSecretAsRogueCost2(lines: readonly string[]): boolean {
	const needle = `id=${PERJURY_CREATED_SECRET_ENTITY_ID} `;
	let sawSecretZone = false;
	let sawRogueClass = false;
	let sawCost2 = false;
	for (const l of lines) {
		if (!l.includes(needle)) continue;
		if (l.includes('tag=ZONE value=SECRET')) sawSecretZone = true;
		if (l.includes('tag=CLASS value=ROGUE')) sawRogueClass = true;
		if (l.includes('tag=COST value=2')) sawCost2 = true;
	}
	return sawSecretZone && sawRogueClass && sawCost2;
}

/** True iff entity 173 is never revealed (no SHOW_ENTITY CardID) in this truncated fixture. */
export function logDoesNotRevealEntity173(lines: readonly string[]): boolean {
	const needle = `id=${PERJURY_CREATED_SECRET_ENTITY_ID} `;
	return !lines.some((l) => l.includes('SHOW_ENTITY') && l.includes(needle) && /CardID=\S+/.test(l));
}
