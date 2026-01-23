/* eslint-disable no-mixed-spaces-and-tabs */
// Tidestone of Golganneth (TSC_641td)
// "Shuffle 5 random spells into your deck. Set their Cost to (1). Draw two cards."
// The spells are shuffled into the deck (random, not discover), so it needs dynamicPool + guessInfo.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TidestoneOfGolganneth: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TidestoneOfGolganneth],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TidestoneOfGolganneth.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cost: { cost: 1, comparison: '==' },
			possibleCards: filterCards(
				TidestoneOfGolganneth.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
