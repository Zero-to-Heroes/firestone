/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Getaway Hogdriver (JAIL_462)
 * Battlecry: Draw 2 cards. If they're both minions, gain Charge.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, inDeck, minion, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const GetawayHogdriver: SelectorCard = {
	cardIds: [TempCardIds.GetawayHogdriver_JAIL_462 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck, minion),
};
