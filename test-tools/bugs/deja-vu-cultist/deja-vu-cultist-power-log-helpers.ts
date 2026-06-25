/**
 * Cultist Map first pick + Deja Vu play (deja-vu-cultist.log):
 * entity 55 dredged to hand (preview 93 / CATA_158), Deja Vu entity 56 played, turn-6 draw entity 57.
 */

export const CULTIST_MAP_CARD_ID = 'TLC_515';
export const DEJA_VU_CARD_ID = 'TIME_039';
export const CULTIST_PREVIEW_CARD_ID = 'CATA_158';

export const CULTIST_FIRST_PICK_DECK_ENTITY = 55;
export const CULTIST_PREVIEW_ENTITY = 93;
export const DEJA_VU_PLAY_ENTITY = 56;
export const NEXT_DRAW_ENTITY = 57;

/** Ground-truth card for entity 57 (revealed later in full match at ~line 42379). */
export const NEXT_DRAW_CARD_ID = 'CATA_785';

export function assertCultistDejaVuAnchorsFromPowerLogLines(lines: readonly string[]): void {
	let cultistMapPlay = false;
	let copiedFrom55 = false;
	let previewCata158 = false;
	let deckToHand55 = false;
	let dejaVuPlay = false;
	let dejaVuGraveyard = false;
	let turn6Draw57 = false;

	for (const line of lines) {
		if (line.includes('Cultist Map') && (line.includes(`CardID=${CULTIST_MAP_CARD_ID}`) || line.includes(`cardId=${CULTIST_MAP_CARD_ID}`))) {
			cultistMapPlay = true;
		}
		if (line.includes(`COPIED_FROM_ENTITY_ID value=${CULTIST_FIRST_PICK_DECK_ENTITY}`)) {
			copiedFrom55 = true;
		}
		if (
			line.includes(`id=${CULTIST_PREVIEW_ENTITY}`) &&
			line.includes(`CardID=${CULTIST_PREVIEW_CARD_ID}`)
		) {
			previewCata158 = true;
		}
		if (
			line.includes(`id=${CULTIST_FIRST_PICK_DECK_ENTITY}`) &&
			line.includes('zone=DECK') &&
			line.includes('tag=ZONE value=HAND')
		) {
			deckToHand55 = true;
		}
		if (
			line.includes(`Deja Vu id=${DEJA_VU_PLAY_ENTITY}`) &&
			line.includes(`cardId=${DEJA_VU_CARD_ID}`)
		) {
			dejaVuPlay = true;
		}
		if (
			line.includes(`Deja Vu id=${DEJA_VU_PLAY_ENTITY}`) &&
			line.includes('tag=ZONE value=GRAVEYARD')
		) {
			dejaVuGraveyard = true;
		}
		if (line.includes(`tag=2166 value=${NEXT_DRAW_ENTITY}`)) {
			turn6Draw57 = true;
		}
	}

	if (
		!cultistMapPlay ||
		!copiedFrom55 ||
		!previewCata158 ||
		!deckToHand55 ||
		!dejaVuPlay ||
		!dejaVuGraveyard ||
		!turn6Draw57
	) {
		throw new Error(
			`[deja-vu-cultist] Missing log anchors: cultistMapPlay=${cultistMapPlay} copiedFrom55=${copiedFrom55} previewCata158=${previewCata158} deckToHand55=${deckToHand55} dejaVuPlay=${dejaVuPlay} dejaVuGraveyard=${dejaVuGraveyard} turn6Draw57=${turn6Draw57}`,
		);
	}
}
