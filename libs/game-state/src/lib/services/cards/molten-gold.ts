/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Molten Gold (JAIL_801)
 * Deal 4 damage. (Cast 3 spells to turn into a minion!)
 */
import { CardIds } from '@firestone-hs/reference-data';

import { HighlightSide } from '@firestone/shared/framework/core';
import { and, inDeck, inHand, or, side, spell } from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const MoltenGold: Card & SelectorCard = {
	cardIds: [CardIds.MoltenGold_JAIL_801],
	selector: (inputSide: HighlightSide) => and(side(inputSide), or(inHand, inDeck), spell),
};
