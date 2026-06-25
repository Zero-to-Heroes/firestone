/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Defias Smuggler (JAIL_998)
 * Prepare. Battlecry: Give a friendly minion +2 Attack and Rush.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const DefiasSmuggler: Card & SelectorCard = {
	cardIds: [CardIds.DefiasSmuggler_JAIL_998],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
