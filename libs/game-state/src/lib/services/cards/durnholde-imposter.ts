/* eslint-disable no-mixed-spaces-and-tabs */
// Durnholde Imposter (WON_026): 3 Mana 3/3 Hunter minion
// "[x]Each turn this is in your hand, transform it into a random 3-Cost minion that gains <b>Poisonous</b>."
// The minion transforms in hand, so it needs guessInfo for hand tracking

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DurnholdeImposter: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.DurnholdeImposter_WON_026],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			DurnholdeImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			DurnholdeImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 3),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
