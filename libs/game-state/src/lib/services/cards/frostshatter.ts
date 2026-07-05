/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Frostshatter (JAIL_803)
 * Freeze an enemy. Draw 2 cards. (Cast 3 spells to turn into a minion!)
 */
import { CardIds } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const Frostshatter: Card & SelectorCard = {
	cardIds: [CardIds.Frostshatter_JAIL_803],
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
