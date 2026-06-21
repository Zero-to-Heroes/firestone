/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Ancient Augur (JAIL_303)
 * Battlecry: Look at 3 cards in your opponent's hand and secretly choose one. Deathrattle: Discard it.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const AncientAugur: Card = {
	cardIds: [TempCardIds.AncientAugur_JAIL_303 as unknown as CardIds],
};
