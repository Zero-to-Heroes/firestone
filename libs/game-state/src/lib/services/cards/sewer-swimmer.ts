/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Sewer Swimmer (JAIL_395)
 * Prepare. Battlecry: Trigger a friendly minion's Deathrattle.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, deathrattle, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const SewerSwimmer: Card & SelectorCard = {
	cardIds: [CardIds.SewerSwimmer_JAIL_395],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), deathrattle, minion),
};
