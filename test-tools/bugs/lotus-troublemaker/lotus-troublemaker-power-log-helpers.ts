/**
 * Ground truth from lotus-troublemaker.log (PowerTaskList ~7304–7332):
 * entity 39 DECK→HAND with no cardId; SHOW_ENTITY id=104 CardID=JAIL_470,
 * COPIED_FROM_ENTITY_ID=39, LINKED_ENTITY=39.
 */

export const LOTUS_TROUBLEMAKER_CARD_ID = 'JAIL_470';

export type LotusTroublemakerLeakAnchors = {
	readonly previewEntityId: number;
	readonly sourceEntityId: number;
};

/** Parse the SETASIDE preview SHOW_ENTITY that leaks JAIL_470 onto a linked deck/hand entity. */
export function parseLotusTroublemakerLeakAnchors(joinedLog: string): LotusTroublemakerLeakAnchors | null {
	const show = joinedLog.match(
		/SHOW_ENTITY - Updating Entity=\[entityName=UNKNOWN ENTITY \[cardType=INVALID\] id=(\d+) zone=SETASIDE[^\]]*\] CardID=JAIL_470[\s\S]{0,1200}?tag=LINKED_ENTITY value=(\d+)[\s\S]{0,800}?tag=COPIED_FROM_ENTITY_ID value=(\d+)/,
	);
	if (!show) {
		return null;
	}
	const previewEntityId = Number(show[1]);
	const linkedEntityId = Number(show[2]);
	const copiedFromEntityId = Number(show[3]);
	if (linkedEntityId !== copiedFromEntityId) {
		return null;
	}
	return { previewEntityId, sourceEntityId: linkedEntityId };
}

/** True if the source entity moves DECK→HAND without a cardId in the same discover resolution. */
export function logDrawsSourceToHandWithoutCardId(joinedLog: string, sourceEntityId: number): boolean {
	const re = new RegExp(
		`TAG_CHANGE Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${sourceEntityId} zone=DECK zonePos=0 cardId= player=2\\] tag=ZONE value=HAND`,
	);
	return re.test(joinedLog);
}
