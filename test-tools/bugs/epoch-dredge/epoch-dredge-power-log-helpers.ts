/**
 * Cultist Map second pick (epoch-dredge.log): entity 189 dredged to top then drawn to opponent hand.
 * Psychic Conjurer earlier revealed TIME_714 for deck entity 189; preview entity 432 links to 189.
 */

export const DREDGED_DECK_ENTITY_ID = 189;
export const PREVIEW_ENTITY_ID = 432;
export const REVEALED_CARD_ID = 'TIME_714';
export const CULTIST_MAP_CARD_ID = 'TLC_515';

/** Cultist Map preview SHOW_ENTITY with COPIED_FROM_ENTITY_ID=189 and LINKED_ENTITY=189. */
export function assertCultistMapDredgeAnchorsFromPowerLogLines(lines: readonly string[]): void {
	let copiedFrom189 = false;
	let linked189 = false;
	let previewTime714 = false;
	let deckToHand189 = false;

	for (const line of lines) {
		if (line.includes(`COPIED_FROM_ENTITY_ID value=${DREDGED_DECK_ENTITY_ID}`)) {
			copiedFrom189 = true;
		}
		if (line.includes(`LINKED_ENTITY value=${DREDGED_DECK_ENTITY_ID}`)) {
			linked189 = true;
		}
		if (
			line.includes(`id=${PREVIEW_ENTITY_ID}`) &&
			line.includes(`CardID=${REVEALED_CARD_ID}`)
		) {
			previewTime714 = true;
		}
		if (
			line.includes(`id=${DREDGED_DECK_ENTITY_ID}`) &&
			line.includes('zone=DECK') &&
			line.includes('tag=ZONE value=HAND')
		) {
			deckToHand189 = true;
		}
	}

	if (!copiedFrom189 || !linked189 || !previewTime714 || !deckToHand189) {
		throw new Error(
			`[epoch-dredge] Missing Cultist Map dredge anchors: copiedFrom189=${copiedFrom189} linked189=${linked189} previewTime714=${previewTime714} deckToHand189=${deckToHand189}`,
		);
	}
}
