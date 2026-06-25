/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Gallagio Goon (JAIL_802)
 * After you play a Battlecry minion, give it +1/+1.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, battlecry, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const GallagioGoon: Card & SelectorCard = {
	cardIds: [CardIds.GallagioGoon_JAIL_802],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), battlecry, minion),
};
