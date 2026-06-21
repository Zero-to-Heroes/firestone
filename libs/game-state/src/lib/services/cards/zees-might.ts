/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Zees Might (JAIL_800hp2)
 * Passive. Every fifth minion you play triggers its Battlecry twice.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, battlecry, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const ZeesMight: Card & SelectorCard = {
	cardIds: [TempCardIds.ZeesMight_JAIL_800hp2 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), battlecry, minion),
};
