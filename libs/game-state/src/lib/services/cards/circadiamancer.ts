/* eslint-disable no-mixed-spaces-and-tabs */
// Circadiamancer (TIME_102): 3 Mana 2/2
// "[x]<b>Battlecry:</b> Add a random 8-Cost minion to your hand. At the start of your turns, reduce its Cost by (1)."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8);

export const Circadiamancer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Circadiamancer_TIME_102],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Circadiamancer.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Circadiamancer.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cost: 8, possibleCards };
	},
};
