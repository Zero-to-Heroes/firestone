/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Zuramats Prison (JAIL_887)
 * Choose a card to discard to summon a 5/5 Taunt. Deathrattle: Free Zuramat who plays one each turn!
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard } from './_card.type';

export const ZuramatsPrison: GeneratingCard = {
	cardIds: [TempCardIds.ZuramatsPrison_JAIL_887 as unknown as CardIds],
};
