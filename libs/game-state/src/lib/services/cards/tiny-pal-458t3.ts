/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tiny Pal (JAIL_458t3)
 * After your hero attacks, summon a random 3-Cost minion. Give it Taunt. Choose another ammunition.
 */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const minionFilter = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3);

export const TinyPal458t3: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TinyPal_JAIL_458t3],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.TinyPal_JAIL_458t3,
			input.allCards,
			minionFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 3, comparison: '==' },
		possibleCards: filterCards(
			CardIds.TinyPal_JAIL_458t3,
			input.allCards,
			minionFilter,
			input.options,
		),
	}),
};
