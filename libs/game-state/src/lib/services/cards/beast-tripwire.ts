/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Beast Tripwire (JAIL_879)
 * Summon a random 5-Cost Beast. Shuffle 2 spells into your deck that do it again when drawn.
 */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const beastFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5) && hasCorrectTribe(c, Race.BEAST);

export const BeastTripwire: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		TempCardIds.BeastTripwire_JAIL_879 as unknown as CardIds,
		TempCardIds.TrippedBeastTripwire_JAIL_879t as unknown as CardIds,
	],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.BeastTripwire_JAIL_879 as unknown as CardIds,
			input.allCards,
			beastFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 5, comparison: '==' },
		races: [Race.BEAST],
		possibleCards: filterCards(
			TempCardIds.BeastTripwire_JAIL_879 as unknown as CardIds,
			input.allCards,
			beastFilter,
			input.options,
		),
	}),
};
