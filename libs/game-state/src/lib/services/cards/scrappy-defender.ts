/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Scrappy Defender (JAIL_311)
 * Taunt. Has +5 Attack if your deck has 25 or more cards.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const ScrappyDefender: SelectorCard = {
	cardIds: [CardIds.ScrappyDefender_JAIL_311],
	selector: (inputSide) => and(side(inputSide), inDeck),
};
