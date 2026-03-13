/* eslint-disable no-mixed-spaces-and-tabs */
// Winterspring Whelp (CATA_484): 1 Mana 2/1 Dragon
// "Battlecry: Add a random Frost spell to your hand."

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WinterspringWhelp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WinterspringWhelp_CATA_484],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			WinterspringWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 1),
			input.options,
		);
		return {
			cardType: CardType.SPELL,
			cost: { cost: 1, comparison: '==' },
			possibleCards: possibleCards,
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			WinterspringWhelp.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 1),
			input.inputOptions,
		);
	},
};
