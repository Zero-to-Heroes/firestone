/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Balland Chain (JAIL_376)
 * Deathrattle: Give your damaged minions +1/+2.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const BallandChain: SelectorCard = {
	cardIds: [CardIds.BallandChain_JAIL_376],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
