/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Holy Bola (JAIL_377)
 * Draw a card. If it costs (2) or less, draw another.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostLess, inDeck, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const HolyBola: SelectorCard = {
	cardIds: [TempCardIds.HolyBola_JAIL_377 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck, effectiveCostLess(3)),
};
