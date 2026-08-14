/* eslint-disable no-mixed-spaces-and-tabs */
// False Disciple (TTN_484): 2 Mana 2/2
// "<b>Battlecry:</b> <b>Discover</b> a <b>Legendary</b> Priest minion from the past."

import { CardIds, CardType, CardClass, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectClass(c, CardClass.PRIEST) &&
	hasCorrectRarity(c, CardRarity.LEGENDARY);

export const FalseDisciple: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FalseDisciple],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(FalseDisciple.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(FalseDisciple.cardIds[0], input.allCards, isMatch, input.options);
		return {
			cardType: CardType.MINION,
			cardClasses: [CardClass.PRIEST],
			rarity: CardRarity.LEGENDARY,
			possibleCards,
		};
	},
};
