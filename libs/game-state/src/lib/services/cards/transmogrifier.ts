/* eslint-disable no-mixed-spaces-and-tabs */
// Transmogrifier (DRG_092): 2 Mana 2/3
// "Whenever you draw a card, transform it into a random <b>Legendary</b> minion."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectRarity(c, CardRarity.LEGENDARY);

export const Transmogrifier: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Transmogrifier],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Transmogrifier.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Transmogrifier.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
