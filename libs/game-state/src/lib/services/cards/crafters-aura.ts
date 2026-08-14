/* eslint-disable no-mixed-spaces-and-tabs */
// Crafter's Aura (TOY_808): 7 Mana
// "At the end of your turn, summon a random 6-Cost minion. Lasts 3 turns."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 6);

export const CraftersAura: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CraftersAura_TOY_808],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(CraftersAura.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(CraftersAura.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cost: 6, possibleCards };
	},
};
