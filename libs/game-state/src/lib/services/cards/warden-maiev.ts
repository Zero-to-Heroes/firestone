/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Warden Maiev (JAIL_850)
 * After you play a minion, give it +3/+3 and make it go Dormant for 1 turn.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const WardenMaiev: Card & SelectorCard = {
	cardIds: [CardIds.WardenMaiev_JAIL_850],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
