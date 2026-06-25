/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hijacked Securitybot (JAIL_457)
 * Prepare. Battlecry: Give your other minions +1/+1.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const HijackedSecuritybot: Card & SelectorCard = {
	cardIds: [CardIds.HijackedSecuritybot_JAIL_457],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
