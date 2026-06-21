/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Shadow Rounds (JAIL_515)
 * Deal 2 damage to an enemy minion. If it dies, cast this on another random enemy minion.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const ShadowRounds: Card = {
	cardIds: [TempCardIds.ShadowRounds_JAIL_515 as unknown as CardIds],
};
