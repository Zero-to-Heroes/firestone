/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Rat Burglar (JAIL_205)
 * At the end of your turn, steal all cards that entered your opponent's hand during your turn.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const RatBurglar: Card = {
	cardIds: [TempCardIds.RatBurglar_JAIL_205 as unknown as CardIds],
};
