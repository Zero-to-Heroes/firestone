/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Mug Zee (JAIL_800)
 * Start of Game: If your deck has no other minions, get Mug's Hero Power. If it has no spells, get Zee's!
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const MugZee: SelectorCard = {
	cardIds: [TempCardIds.MugZee_JAIL_800 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
