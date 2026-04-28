import { CardIds } from '@firestone-hs/reference-data';

/**
 * Rewind regression: opponent's player-1 entity 219 is first emitted as a Hunter SECRET inside a
 * The Origin Stone trigger nested under Sands of Time #2 (`TIME_EVENT_999`, has `tag=REWIND value=1`).
 * Sands then `BlockType=GAME_RESET`s; on the post-rewind branch the same id 219 is re-bound and
 * revealed as `TLC_462` (Unearthed Artifacts) — an EPIC Mage spell, NOT a secret — going straight
 * `SETASIDE → PLAY → GRAVEYARD`. After replay, 219 must NOT remain in `opponentDeck.secrets`.
 */

/** Entity id of the secret created pre-rewind (Hunter secret) and re-bound post-rewind as TLC_462. */
export const REWOUND_SECRET_ENTITY_ID = 219;

/** Card the post-rewind branch reveals on entity 219 (Mage EPIC spell, not a secret). */
export const REWOUND_REPLACEMENT_CARD_ID = CardIds.UnearthedArtifacts_TLC_462 as string;

/** Sands of Time card id; the rewind-capable origin block whose GAME_RESET re-binds entity 219. */
export const SANDS_OF_TIME_CARD_ID = CardIds.SandsOfTime_TIME_EVENT_999 as string;

/**
 * True iff the log shows entity 219 entering `ZONE=SECRET` with `CLASS=HUNTER` (its pre-rewind
 * identity). Confirms we're testing the right branch even before the parser runs.
 */
export function logShowsEntity219EnteringSecretAsHunter(lines: readonly string[]): boolean {
	let sawSecretZone = false;
	let sawHunterClass = false;
	for (const l of lines) {
		if (!l.includes(`Entity=${REWOUND_SECRET_ENTITY_ID} `)) continue;
		if (l.includes('tag=ZONE value=SECRET')) sawSecretZone = true;
		if (l.includes('tag=CLASS value=HUNTER')) sawHunterClass = true;
		if (sawSecretZone && sawHunterClass) return true;
	}
	return false;
}

/**
 * True iff the log later reveals entity 219 with `CardID=TLC_462` (Unearthed Artifacts) — i.e.
 * the post-rewind re-binding actually appears in this fixture window.
 */
export function logShowsEntity219RevealedAsUnearthedArtifacts(lines: readonly string[]): boolean {
	const needle = `id=${REWOUND_SECRET_ENTITY_ID} `;
	return lines.some(
		(l) =>
			l.includes('SHOW_ENTITY') && l.includes(needle) && l.includes(`CardID=${REWOUND_REPLACEMENT_CARD_ID}`),
	);
}

/** True iff Sands of Time (`TIME_EVENT_999`) appears with `tag=REWIND value=1` in this fixture. */
export function logShowsSandsOfTimeWithRewindMechanic(lines: readonly string[]): boolean {
	const sawSandsReveal = lines.some((l) => l.includes(`CardID=${SANDS_OF_TIME_CARD_ID}`));
	const sawRewindTag = lines.some((l) => l.includes('tag=REWIND value=1'));
	return sawSandsReveal && sawRewindTag;
}
