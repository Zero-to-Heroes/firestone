/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * The Unseen Atlas (JAIL_514)
 * Draw 3 cards. Costs (1) less for each card in your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inHand, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const TheUnseenAtlas: SelectorCard = {
	cardIds: [CardIds.TheUnseenAtlas_JAIL_514],
	selector: (inputSide) => and(side(inputSide), inHand),
};
