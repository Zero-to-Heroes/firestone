/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Mugs Magic (JAIL_800hp1)
 * Passive. Your first minion each turn costs (2) less.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const MugsMagic: Card & SelectorCard = {
	cardIds: [CardIds.MugsMagic_JAIL_800hp1],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
