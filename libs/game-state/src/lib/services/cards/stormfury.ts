/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Stormfury (JAIL_805)
 * Lifesteal. Deal 2 damage to all enemy minions. (Cast 3 spells to turn into a minion!)
 */
import { CardIds } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const Stormfury: Card & SelectorCard = {
	cardIds: [CardIds.Stormfury_JAIL_805],
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
