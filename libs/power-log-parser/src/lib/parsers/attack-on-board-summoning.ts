import { GameTag } from '@firestone-hs/reference-data';
import { FullEntity } from '../models';

/**
 * Whether a minion is treated as having summoning sickness for the attack-on-board total
 * (deck tracker overlay).
 */
export function hasSummoningSicknessForAttackOnBoard(
	e: FullEntity,
	isActivePlayer: boolean,
	isHero: boolean,
): boolean {
	if (isHero) {
		return false;
	}
	if (!isActivePlayer) {
		return false;
	}
	if (e.HasTag(GameTag.CHARGE) || e.HasTag(GameTag.NON_KEYWORD_CHARGE)) {
		return false;
	}
	if (e.HasTag(GameTag.RUSH) || e.HasTag(GameTag.COLOSSAL_LIMB)) {
		return false;
	}
	return e.HasTag(GameTag.EXHAUSTED) || e.GetTag(GameTag.NUM_TURNS_IN_PLAY, 0) === 0;
}
