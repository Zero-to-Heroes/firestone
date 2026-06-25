/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Rioter (JAIL_029)
 * After a friendly minion survives damage, give it +1 Attack.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';

import { SelectorCard } from './_card.type';

export const Rioter: SelectorCard = {
	cardIds: [CardIds.Rioter_JAIL_029],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
