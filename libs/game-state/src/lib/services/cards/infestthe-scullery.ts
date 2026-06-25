/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Infestthe Scullery (JAIL_200)
 * Summon a random 4-Cost minion. (Improved by your hero attacks this game.)
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const InfesttheScullery: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.InfesttheScullery_JAIL_200],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CardIds.InfesttheScullery_JAIL_200, input.allCards, minionFilter, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		possibleCards: filterCards(CardIds.InfesttheScullery_JAIL_200, input.allCards, minionFilter, input.options),
	}),
};
