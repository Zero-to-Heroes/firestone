/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Hellraiser (JAIL_734)
 * Battlecry: Discover a card in your deck. If it's empty, gain +4/+4 instead.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, GeneratingCard } from './_card.type';

export const Hellraiser: Card & GeneratingCard = {
	cardIds: [TempCardIds.Hellraiser_JAIL_734 as unknown as CardIds],
	publicTutor: true,
};
