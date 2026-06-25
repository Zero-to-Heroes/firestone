/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Annihilation (JAIL_510)
 * Destroy all minions. Summon any Demons in the bottom 3 cards of your deck.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, demon, inDeck, minion, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const Annihilation: Card & SelectorCard = {
	cardIds: [CardIds.Annihilation_JAIL_510],
	selector: (inputSide) => and(side(inputSide), inDeck, demon, minion),
};
