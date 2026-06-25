/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Unshackle Soul (JAIL_433)
 * Destroy a minion. If you played a copy of an opponent's card while holding this, this costs (1).
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, copiedFromOpponent, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const UnshackleSoul: SelectorCard = {
	cardIds: [CardIds.UnshackleSoul_JAIL_433],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), copiedFromOpponent),
};
