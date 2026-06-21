/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Enthralled Shade (JAIL_434)
 * Deathrattle: Reduce the Cost of cards in your hand that were copied from your opponent by (1).
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, copiedFromOpponent, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const EnthralledShade: Card & SelectorCard = {
	cardIds: [TempCardIds.EnthralledShade_JAIL_434 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), copiedFromOpponent),
};
