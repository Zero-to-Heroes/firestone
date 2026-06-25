/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Black Market Overseer (JAIL_880)
 * Whenever you play a Deathrattle minion, give it Rush.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, deathrattle, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const BlackMarketOverseer: Card & SelectorCard = {
	cardIds: [CardIds.BlackMarketOverseer_JAIL_880],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), deathrattle, minion),
};
