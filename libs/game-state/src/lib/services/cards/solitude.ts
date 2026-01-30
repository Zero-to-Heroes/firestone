/* eslint-disable no-mixed-spaces-and-tabs */
// Solitude (TIME_448): 3 Mana Demon Hunter spell
// "<b>Discover</b> 2 minions. If your deck has no minions, reduce the Cost of any in your hand by (2)."
// The card is discovered, so it needs guessInfo and dynamicPool for minions that can be discovered by the current class

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Solitude: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Solitude_TIME_448],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Solitude.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, input.inputOptions.currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				Solitude.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
