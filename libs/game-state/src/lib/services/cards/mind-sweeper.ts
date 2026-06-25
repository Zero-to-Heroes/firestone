/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Mind Sweeper (JAIL_432)
 * Battlecry: If you played a copy of an opponent's card while holding this, deal 2 damage to all enemy minions.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { and, copiedFromOpponent, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const MindSweeper: SelectorCard = {
	cardIds: [CardIds.MindSweeper_JAIL_432],
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), copiedFromOpponent),
};
