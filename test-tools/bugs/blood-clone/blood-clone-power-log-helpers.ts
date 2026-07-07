import { CardIds } from '@firestone-hs/reference-data';

const BLOOD_CLONE_SOURCE_MARKER = `Source=[entityName=Blood Clone id=`;

/**
 * Blood Clone spell entity id from discover source line (e.g. 60 in fixture).
 */
export function parseBloodCloneCreatorEntityId(raw: string): number | null {
	const idx = raw.indexOf(BLOOD_CLONE_SOURCE_MARKER);
	if (idx < 0) {
		return null;
	}
	const tail = raw.slice(idx);
	const m = tail.match(
		/Source=\[entityName=Blood Clone id=(\d+) zone=PLAY zonePos=0 cardId=JAIL_451 player=2\]/,
	);
	return m ? Number(m[1]) : null;
}

/**
 * After Blood Clone discover, read chosen entity id from DebugPrintEntitiesChosen.
 */
export function parseChosenHandEntityIdFromBloodCloneDiscover(raw: string): number | null {
	const idx = raw.indexOf(BLOOD_CLONE_SOURCE_MARKER);
	if (idx < 0) {
		return null;
	}
	const tail = raw.slice(idx);
	const chosen =
		tail.match(
			/DebugPrintEntitiesChosen\(\)[\s\S]*?Entities\[0\]=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+)/,
		) ?? tail.match(/Entities\[0\]=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+)/);
	return chosen?.[1] != null ? Number(chosen[1]) : null;
}

/**
 * First summoned copy CardID from Blood Clone subspell (CREATOR = Blood Clone entity).
 */
export function parseSummonedCopyCardIdFromBloodClone(raw: string, creatorEntityId: number): string | null {
	const idx = raw.indexOf(BLOOD_CLONE_SOURCE_MARKER);
	if (idx < 0) {
		return null;
	}
	const tail = raw.slice(idx);
	const re = new RegExp(
		`SUB_SPELL_START[\\s\\S]*?Source = \\[entityName=Blood Clone id=${creatorEntityId}[\\s\\S]*?SHOW_ENTITY - Updating Entity=(?:\\[entityName=[^\\]]*\\] id=|)(\\d+)[^\\n]*CardID=(\\w+)`,
	);
	const m = tail.match(re);
	if (m?.[2]) {
		return m[2];
	}
	// GameState stream: SHOW_ENTITY - Updating Entity=142 CardID=JAIL_453 after Blood Clone source
	const re2 = new RegExp(
		`Source = \\[entityName=Blood Clone id=${creatorEntityId}[\\s\\S]*?SHOW_ENTITY - Updating Entity=(\\d+) CardID=(\\w+)`,
	);
	const m2 = tail.match(re2);
	return m2?.[2] ?? null;
}

export const BLOOD_CLONE_CARD_ID = CardIds.BloodClone_JAIL_451;
