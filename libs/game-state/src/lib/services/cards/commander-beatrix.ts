/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Commander Beatrix (JAIL_397)
 * Taunt. While building your deck, pick a 2-Cost minion. Ten copies join your deck!
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostLess, inDeck, minion, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const CommanderBeatrix: SelectorCard = {
	cardIds: [TempCardIds.CommanderBeatrix_JAIL_397 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck, minion, effectiveCostLess(3)),
};
