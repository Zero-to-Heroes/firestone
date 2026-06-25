/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * R4T-C4TCH3R (JAIL_882)
 * Battlecry: Copy all spells in your deck. Deathrattle: Draw one.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, inDeck, side, spell } from '../card-highlight/selectors';
import { Card, GeneratingCard, SelectorCard } from './_card.type';

export const R4TC4TCH3R: Card & SelectorCard & GeneratingCard = {
	cardIds: [CardIds.R4TC4TCH3R_JAIL_882],
	publicTutor: true,
	selector: (inputSide) => and(side(inputSide), inDeck, spell),
};
