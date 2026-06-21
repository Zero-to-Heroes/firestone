/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vampyrs Kiss (JAIL_446hp)
 * Give a minion +3 Attack. This costs Corpses instead of Mana.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const VampyrsKiss: Card & SelectorCard = {
	cardIds: [TempCardIds.VampyrsKiss_JAIL_446hp as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
