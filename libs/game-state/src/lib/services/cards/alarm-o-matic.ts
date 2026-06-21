/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Alarm-O-Matic (JAIL_502)
 * At the start of your turn, swap this minion with a random one in your opponent's hand.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const AlarmOMatic: Card = {
	cardIds: [TempCardIds.AlarmOMatic_JAIL_502 as unknown as CardIds],
};
