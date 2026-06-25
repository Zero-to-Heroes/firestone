/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Soothsayer (JAIL_912)
 * Prepare, Taunt. Deathrattle: Restore 6 Health to your hero. Summon a random 6-Cost minion.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const Soothsayer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Soothsayer_JAIL_912],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.Soothsayer_JAIL_912,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 6, comparison: '==' },
		possibleCards: filterCards(
			CardIds.Soothsayer_JAIL_912,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
};
