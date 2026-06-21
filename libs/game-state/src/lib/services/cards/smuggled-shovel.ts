/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Smuggled Shovel (JAIL_380)
 * Deathrattle: Draw a spell that didn't start in your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, notInInitialDeck, side, spell } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const SmuggledShovel: Card & SelectorCard = {
	cardIds: [TempCardIds.SmuggledShovel_JAIL_380 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck, spell, notInInitialDeck),
};
