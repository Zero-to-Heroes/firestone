import { GameTag } from '@firestone-hs/reference-data';
import { Action, ShowEntity, TagChange } from '../models';

/**
 * True when `action` applies a dungeon-run-style max-health enchant (SHOW_ENTITY with ATTACHED =
 * hero) and contains a HEALTH TAG_CHANGE on that hero. Used instead of obsolete TAG_CHANGE … DEF CHANGE lines.
 *
 * When `passiveCardIds` is non-empty, CardId must be listed (e.g. Kobolds `LOOTA_Health`).
 * When empty/undefined, CardId must end with `_Health` (Monster Hunt / Rumble analogues).
 */
export function actionHasDungeonHealthPassiveOnHero(
	action: Action,
	heroEntityId: number,
	passiveCardIds?: readonly string[],
): boolean {
	const recursive = action.GetDataRecursive();
	let hasPassive = false;
	for (const data of recursive) {
		if (!(data instanceof ShowEntity)) continue;
		const cardId = data.CardId;
		if (!cardId) continue;
		if (data.GetTag(GameTag.ATTACHED) !== heroEntityId) continue;
		const matches =
			passiveCardIds != null && passiveCardIds.length > 0
				? passiveCardIds.includes(cardId)
				: cardId.endsWith('_Health');
		if (matches) {
			hasPassive = true;
			break;
		}
	}
	if (!hasPassive) return false;
	return recursive.some(
		(d) =>
			d instanceof TagChange &&
			d.Name === (GameTag.HEALTH as number) &&
			d.Entity === heroEntityId,
	);
}

export function lastHeroHealthTagChangeInAction(action: Action, heroEntityId: number): TagChange | undefined {
	const recursive = action.GetDataRecursive();
	const matches = recursive.filter(
		(d): d is TagChange =>
			d instanceof TagChange &&
			d.Name === (GameTag.HEALTH as number) &&
			d.Entity === heroEntityId,
	);
	return matches.length ? matches[matches.length - 1] : undefined;
}
