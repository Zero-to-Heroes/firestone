/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * R4T-C4TCH3R (JAIL_882)
 * Battlecry: Copy all spells in your deck. Deathrattle: Draw one.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, inDeck, side, spell } from '../card-highlight/selectors';
import { Card, GeneratingCard, SelectorCard } from './_card.type';

export const R4TC4TCH3R: Card & SelectorCard & GeneratingCard = {
	cardIds: [TempCardIds.R4TC4TCH3R_JAIL_882 as unknown as CardIds],
	publicTutor: true,
	selector: (inputSide) => and(side(inputSide), inDeck, spell),
};
