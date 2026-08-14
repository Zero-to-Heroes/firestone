/* eslint-disable no-mixed-spaces-and-tabs */
// Wishing Well (WW_415): 5 Mana 0/7
// "[x]After you play a Coin, get a random <b>Legendary</b> minion from another class and set its Cost to (1)."

import { CardIds, CardType, CardRarity, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, fromAnotherClass, hasCorrectRarity } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCorrectRarity(c, CardRarity.LEGENDARY) &&
	fromAnotherClass(c, currentClass);

export const WishingWell: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WishingWell_WW_415],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			WishingWell.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			WishingWell.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, rarity: CardRarity.LEGENDARY, possibleCards };
	},
};
