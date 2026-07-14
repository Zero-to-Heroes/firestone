import { CardIds } from '@firestone-hs/reference-data';

/** Local player plays Clean the Scene as entity 35 (`SHOW_ENTITY … REV_252t` after PLAY, player=2). */
export const LOCAL_PLAYER_CLEAN_THE_SCENE_PLAY_ENTITY_ID = 35;

/** Opponent stolen copy in hand (`COPIED_FROM_ENTITY_ID value=35` on entity 118, player=1). */
export const OPPONENT_STOLEN_CLEAN_THE_SCENE_ENTITY_ID = 118;

/**
 * Entity id of Clean the Scene played by player 2 with infused token reveal.
 */
export function parseLocalPlayerCleanTheScenePlayEntityId(raw: string): number | null {
	if (
		!raw.includes(
			'BLOCK_START BlockType=PLAY Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=35 zone=HAND zonePos=3 cardId= player=2]',
		)
	) {
		return null;
	}
	if (
		!raw.includes(
			'SHOW_ENTITY - Updating Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=35 zone=HAND zonePos=3 cardId= player=2] CardID=REV_252t',
		)
	) {
		return null;
	}
	return LOCAL_PLAYER_CLEAN_THE_SCENE_PLAY_ENTITY_ID;
}

/**
 * Opponent hand entity copied from the local player's Clean the Scene.
 */
export function parseOpponentStolenCleanTheSceneEntityId(raw: string, sourceEntityId: number): number | null {
	const marker = `COPIED_FROM_ENTITY_ID value=${sourceEntityId}`;
	if (!raw.includes(marker)) {
		return null;
	}
	const re = new RegExp(
		`Clean the Scene id=(\\d+) zone=HAND[\\s\\S]{0,400}?COPIED_FROM_ENTITY_ID value=${sourceEntityId}`,
	);
	const m = raw.match(re);
	return m ? Number(m[1]) : null;
}

/**
 * Last infused card id for opponent stolen copy (CHANGE_ENTITY to REV_252t).
 */
export function parseOpponentStolenCopyCardIdAfterInfuse(raw: string, opponentEntityId: number): string | null {
	const re = new RegExp(
		`CHANGE_ENTITY - Updating Entity=\\[entityName=Clean the Scene id=${opponentEntityId} zone=HAND[^\\]]*\\] CardID=(REV_252t)`,
	);
	const matches = [...raw.matchAll(new RegExp(re.source, 'g'))];
	return matches.at(-1)?.[1] ?? null;
}

export const CLEAN_THE_SCENE_BASE_ID = CardIds.CleanTheScene;
export const CLEAN_THE_SCENE_INFUSED_ID = CardIds.CleanTheScene_CleanTheSceneToken;
