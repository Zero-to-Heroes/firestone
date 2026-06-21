/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hijacked Securitybot (JAIL_457)
 * Prepare. Battlecry: Give your other minions +1/+1.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const HijackedSecuritybot: Card & SelectorCard = {
	cardIds: [TempCardIds.HijackedSecuritybot_JAIL_457 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
