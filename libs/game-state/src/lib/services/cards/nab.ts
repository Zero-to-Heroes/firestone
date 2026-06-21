/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Nab (JAIL_225)
 * Deal 3 damage to a minion. If it dies, shuffle a copy of it into your deck that costs (2).
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const Nab: Card = {
	cardIds: [TempCardIds.Nab_JAIL_225 as unknown as CardIds],
};
