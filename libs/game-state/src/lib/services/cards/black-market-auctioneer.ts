/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Black Market Auctioneer (JAIL_718)
 * Prepare. Whenever you cast a spell, draw a card.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const BlackMarketAuctioneer: Card & SelectorCard = {
	cardIds: [CardIds.BlackMarketAuctioneer_JAIL_718],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
