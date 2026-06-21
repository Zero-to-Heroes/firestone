/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Releasethe Beasts (JAIL_387)
 * Give minions in your hand +1/+1. Legendary minions get an extra +2/+1.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, highlightConditions, inDeck, inHand, legendary, minion, or, side } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const ReleasetheBeasts: Card & SelectorCard = {
	cardIds: [TempCardIds.ReleasetheBeasts_JAIL_387 as unknown as CardIds],
	selector: (inputSide) =>
		highlightConditions(
			and(side(inputSide), or(inHand, inDeck), minion),
			and(side(inputSide), or(inHand, inDeck), minion, legendary),
		),
};
