/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Vama Looming Death (JAIL_118)
 * Battlecry: Destroy all non-Paladin minions.
 */
import { CardIds } from '@firestone-hs/reference-data';

import {
	and,
	highlightConditions,
	inDeck,
	inHand,
	inPlay,
	minion,
	not,
	or,
	paladin,
	side,
} from '../card-highlight/selectors';
import { SelectorCard } from './_card.type';

export const VamaLoomingDeath: SelectorCard = {
	cardIds: [CardIds.VamaLoomingDeath_JAIL_118],
	selector: (inputSide) =>
		highlightConditions(
			and(inPlay, minion, not(paladin)),
			and(side(inputSide), or(inHand, inDeck), minion, not(paladin)),
		),
};
