/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Bone Flurry (JAIL_445)
 * Deal 3 damage randomly split among enemies. If a friendly minion died this turn, deal 3 more.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card } from './_card.type';

export const BoneFlurry: Card = {
	cardIds: [TempCardIds.BoneFlurry_JAIL_445 as unknown as CardIds],
};
