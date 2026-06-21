/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Gallagio Goon (JAIL_802)
 * After you play a Battlecry minion, give it +1/+1.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, battlecry, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { Card, SelectorCard } from './_card.type';

export const GallagioGoon: Card & SelectorCard = {
	cardIds: [TempCardIds.GallagioGoon_JAIL_802 as unknown as CardIds],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), battlecry, minion),
};
