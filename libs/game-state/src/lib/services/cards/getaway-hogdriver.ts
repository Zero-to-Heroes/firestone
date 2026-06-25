/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Getaway Hogdriver (JAIL_462)
 * Battlecry: Draw 2 cards. If they're both minions, gain Charge.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, inDeck, minion, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const GetawayHogdriver: SelectorCard = {
	cardIds: [CardIds.GetawayHogdriver_JAIL_462],
	selector: (inputSide) => and(side(inputSide), inDeck, minion),
};
