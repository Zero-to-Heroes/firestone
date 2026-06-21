/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Soothsayer (JAIL_912)
 * Prepare, Taunt. Deathrattle: Restore 6 Health to your hero. Summon a random 6-Cost minion.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const Soothsayer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.Soothsayer_JAIL_912 as unknown as CardIds],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.Soothsayer_JAIL_912 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 6, comparison: '==' },
		possibleCards: filterCards(
			TempCardIds.Soothsayer_JAIL_912 as unknown as CardIds,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
};
