/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Blackpaws Whip (JAIL_503)
 * Costs (1) less for each Coin you're holding. Deathrattle: Draw a card.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, coinExtended, inHand, side } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const BlackpawsWhip: Card & SelectorCard = {
	cardIds: [CardIds.BlackpawsWhip_JAIL_503],
	selector: (inputSide) => and(side(inputSide), inHand, coinExtended),
};
