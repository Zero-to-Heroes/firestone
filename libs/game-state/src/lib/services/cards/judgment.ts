/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Judgment (JAIL_326)
 * Prepare. Choose a friendly minion. Set all minions' stats equal to that minion's.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { SelectorCard } from './_card.type';

export const Judgment: SelectorCard = {
	cardIds: [TempCardIds.Judgment_JAIL_326 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
