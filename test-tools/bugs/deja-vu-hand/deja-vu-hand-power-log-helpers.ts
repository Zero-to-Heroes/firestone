/**
 * Deja Vu (TIME_039) discover from opponent hand (deja-vu-hand.log):
 * local play entity 28; SETASIDE copies 83/84/85 linked to opponent hand entities 38/42/57.
 */

export const DEJA_VU_CARD_ID = 'TIME_039';
export const DEJA_VU_PLAY_ENTITY = 28;

/** Opponent hand source entity → revealed card id from COPIED_FROM / discover options. */
export const DEJA_VU_OPPONENT_HAND_REVEALS: readonly { entityId: number; cardId: string; cardName: string }[] = [
	{ entityId: 38, cardId: 'DS1_055', cardName: 'Darkscale Healer' },
	{ entityId: 42, cardId: 'CS2_124', cardName: 'Wolfrider' },
	{ entityId: 57, cardId: 'EX1_306', cardName: 'Felstalker' },
];

export function assertDejaVuHandAnchorsFromPowerLogLines(lines: readonly string[]): void {
	const joined = lines.join('\n');
	const dejaVuPlay =
		joined.includes(`BLOCK_START BlockType=PLAY Entity=[entityName=Deja Vu id=${DEJA_VU_PLAY_ENTITY}`) &&
		joined.includes(`cardId=${DEJA_VU_CARD_ID}`);
	if (!dejaVuPlay) {
		throw new Error(`[deja-vu-hand] Missing Deja Vu play anchor (entity ${DEJA_VU_PLAY_ENTITY})`);
	}

	for (const reveal of DEJA_VU_OPPONENT_HAND_REVEALS) {
		const hasCopied =
			joined.includes(`cardId=${reveal.cardId}`) &&
			joined.includes(`tag=COPIED_FROM_ENTITY_ID value=${reveal.entityId}`);
		const hasLinked = joined.includes(`tag=LINKED_ENTITY value=${reveal.entityId}`);
		if (!hasCopied || !hasLinked) {
			throw new Error(
				`[deja-vu-hand] Missing copy/link for ${reveal.cardName} (${reveal.cardId}) ← entity ${reveal.entityId}: copied=${hasCopied} linked=${hasLinked}`,
			);
		}
	}
}
