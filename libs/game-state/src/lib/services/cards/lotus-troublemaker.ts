/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lotus Troublemaker (JAIL_470)
 * Battlecry: Shoot 1 random enemy for 2 damage. (Play cards for 2 Mana while holding to shoot more!)
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostEqual, inDeck, inHand, or, side } from '../card-highlight/selectors';

import { SelectorCard } from './_card.type';

export const LotusTroublemaker: SelectorCard = {
	cardIds: [CardIds.LotusTroublemaker_JAIL_470],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), effectiveCostEqual(2)),
};
