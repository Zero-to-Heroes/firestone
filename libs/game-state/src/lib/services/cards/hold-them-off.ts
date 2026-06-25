/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hold Them Off (JAIL_913)
 * Prepare. Give a minion +5/+5 and Lifesteal.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const HoldThemOff: Card & SelectorCard = {
	cardIds: [CardIds.HoldThemOff_JAIL_913],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
