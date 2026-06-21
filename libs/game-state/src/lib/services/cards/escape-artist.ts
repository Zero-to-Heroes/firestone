/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Escape Artist (JAIL_030)
 * After this attacks and survives, draw a card and escape the game!
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const EscapeArtist: Card = {
	cardIds: [TempCardIds.EscapeArtist_JAIL_030 as unknown as CardIds],
};
