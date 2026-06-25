/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Smuggled Shovel (JAIL_380)
 * Deathrattle: Draw a spell that didn't start in your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, notInInitialDeck, side, spell } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const SmuggledShovel: Card & SelectorCard = {
	cardIds: [CardIds.SmuggledShovel_JAIL_380],
	selector: (inputSide) => and(side(inputSide), inDeck, spell, notInInitialDeck),
};
