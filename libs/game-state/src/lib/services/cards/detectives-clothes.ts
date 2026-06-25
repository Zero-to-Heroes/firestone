/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Detectives Clothes (JAIL_447t)
 * Give a minion +4/+4 and Rush.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, minion, or, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const DetectivesClothes: Card & SelectorCard = {
	cardIds: [CardIds.DetectivesClothes_JAIL_447t],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), minion),
};
