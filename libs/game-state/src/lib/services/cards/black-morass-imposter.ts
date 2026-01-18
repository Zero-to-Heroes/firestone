/* eslint-disable no-mixed-spaces-and-tabs */
// Black Morass Imposter (WON_039): 2 Mana 2/2 Mage minion
// "[x]Each turn this is in your hand, transform it into a random 2-Cost minion that gains <b>Spell Damage +1</b>."
// The minion transforms in hand, so it needs guessInfo for hand tracking

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const BlackMorassImposter: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BlackMorassImposter_WON_039],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			BlackMorassImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BlackMorassImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
