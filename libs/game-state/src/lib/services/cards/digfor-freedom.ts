/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Digfor Freedom (JAIL_876)
 * Give a friendly minion Deathrattle: Summon two random 4-Cost minions.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { and, inDeck, inHand, inPlay, minion, or, side } from '../card-highlight/selectors';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { SelectorCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const DigforFreedom: StaticGeneratingCard & SelectorCard = {
	cardIds: [TempCardIds.DigforFreedom_JAIL_876 as unknown as CardIds],
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TempCardIds.DigforFreedom_JAIL_876 as unknown as CardIds, input.allCards, minionFilter, input.inputOptions),
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck, inPlay), minion),
};
