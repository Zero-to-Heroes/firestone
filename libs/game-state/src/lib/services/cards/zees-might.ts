/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Zees Might (JAIL_800hp2)
 * Passive. Every fifth minion you play triggers its Battlecry twice.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, battlecry, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const ZeesMight: Card & SelectorCard = {
	cardIds: [CardIds.ZeesMight_JAIL_800hp2],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), battlecry, minion),
};
