/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Picklock (JAIL_501)
 * All numbers on this card equal your remaining Mana. Battlecry: Deal 1 damage to an enemy minion.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const Picklock: Card = {
	cardIds: [TempCardIds.Picklock_JAIL_501 as unknown as CardIds],
};
