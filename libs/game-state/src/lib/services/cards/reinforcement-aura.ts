/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Reinforcement Aura (JAIL_327)
 * At the end of your turn, summon a minion from your deck that costs (2) or less. Lasts 3 turns.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostLess, inDeck, minion, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const ReinforcementAura: Card & SelectorCard = {
	cardIds: [TempCardIds.ReinforcementAura_JAIL_327 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), inDeck, minion, effectiveCostLess(3)),
};
