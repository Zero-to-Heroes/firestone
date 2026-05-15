import { GameTag } from '@firestone-hs/reference-data';
import { FullEntity } from '../models';

/**
 * Whether a minion is treated as having summoning sickness for the attack-on-board total
 * (deck tracker overlay).
 *
 * The total represents potential face damage. RUSH and COLOSSAL_LIMB minions can attack other
 * minions on their summon turn but cannot attack the enemy hero, so for face-damage purposes
 * they are sick on the turn they enter play. CHARGE/NON_KEYWORD_CHARGE minions can hit hero
 * immediately and are handled separately.
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
	return e.HasTag(GameTag.EXHAUSTED) || e.GetTag(GameTag.NUM_TURNS_IN_PLAY, 0) === 0;
}
