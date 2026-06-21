/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Truth Seeker (JAIL_329)
 * After your hero attacks, give your Paladin minions +2/+2.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
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
	cardIds: [TempCardIds.TruthSeeker_JAIL_329 as unknown as CardIds],
	selector: (inputSide) =>
		highlightConditions(
			and(side(inputSide), or(inHand, inDeck, inPlay), paladin, minion),
			and(side(inputSide), or(inHand, inDeck), givesHeroAttack),
		),
};
