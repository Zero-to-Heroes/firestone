/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Crowd Control (JAIL_307)
 * Deal 2 damage to all minions. If your deck has 25 or more cards, deal 2 more.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const CrowdControl: SelectorCard = {
	cardIds: [TempCardIds.CrowdControl_JAIL_307 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck),
};
