/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Disguised Watchman (JAIL_455)
 * Can be played on either side. Battlecry: Deal 1 damage to all other friendly minions, twice.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, inPlay, minion, side } from '../card-highlight/selectors';

import { Card, SelectorCard } from './_card.type';

export const DisguisedWatchman: SelectorCard = {
	cardIds: [CardIds.DisguisedWatchman_JAIL_455],
	selector: (inputSide) => and(side(inputSide), inPlay, minion),
};
