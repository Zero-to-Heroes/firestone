/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Infestthe Scullery (JAIL_200)
 * Summon a random 4-Cost minion. (Improved by your hero attacks this game.)
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const InfesttheScullery: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.InfesttheScullery_JAIL_200 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TempCardIds.InfesttheScullery_JAIL_200 as unknown as CardIds, input.allCards, minionFilter, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		possibleCards: filterCards(TempCardIds.InfesttheScullery_JAIL_200 as unknown as CardIds, input.allCards, minionFilter, input.options),
	}),
};
