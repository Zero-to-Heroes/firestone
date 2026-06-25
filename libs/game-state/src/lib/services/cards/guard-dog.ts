/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Guard Dog (JAIL_878)
 * Deathrattle: Summon a random 1-Cost Deathrattle minion.
 */
import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1) && hasMechanic(c, GameTag.DEATHRATTLE);

export const GuardDog: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GuardDog_JAIL_878],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.GuardDog_JAIL_878,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 1, comparison: '==' },
		mechanics: [GameTag.DEATHRATTLE],
		possibleCards: filterCards(
			CardIds.GuardDog_JAIL_878,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
};
