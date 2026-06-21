/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * The Unseen Atlas (JAIL_514)
 * Draw 3 cards. Costs (1) less for each card in your hand.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inHand, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const TheUnseenAtlas: SelectorCard = {
	cardIds: [TempCardIds.TheUnseenAtlas_JAIL_514 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inHand),
};
