/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Jailbird (JAIL_453)
 * Taunt. When you Prepare while holding this, reduce this card's Cost by the same amount.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, inDeck, inHand, or, prepare, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const Jailbird: SelectorCard = {
	cardIds: [CardIds.Jailbird_JAIL_453],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), prepare),
};
