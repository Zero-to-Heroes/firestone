/* eslint-disable no-mixed-spaces-and-tabs */
// Everything Must Go! (TOY_519): 8 Mana
// "Summon two random 4-Cost minions. Costs (1) less for each card you've drawn this turn."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4);

export const EverythingMustGo: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EverythingMustGo_TOY_519],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(EverythingMustGo.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(EverythingMustGo.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cost: 4, possibleCards };
	},
};
