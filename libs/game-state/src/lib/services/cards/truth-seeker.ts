/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Truth Seeker (JAIL_329)
 * After your hero attacks, give your Paladin minions +2/+2.
 */
import { CardIds } from '@firestone-hs/reference-data';

import {
	and,
	givesHeroAttack,
	highlightConditions,
	inDeck,
	inHand,
	inPlay,
	minion,
	or,
	paladin,
	side,
} from '../card-highlight/selectors';
import { Card, SelectorCard } from './_card.type';

export const TruthSeeker: Card & SelectorCard = {
	cardIds: [CardIds.TruthSeeker_JAIL_329],
	selector: (inputSide) =>
		highlightConditions(
			and(side(inputSide), or(inHand, inDeck, inPlay), paladin, minion),
			and(side(inputSide), or(inHand, inDeck), givesHeroAttack),
		),
};
