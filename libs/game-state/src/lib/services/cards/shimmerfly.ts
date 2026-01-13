/* eslint-disable no-mixed-spaces-and-tabs */
// Shimmerfly (DAL_587)
// Deathrattle: Add a random Hunter spell to your hand.
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Shimmerfly: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Shimmerfly],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Shimmerfly.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.HUNTER),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass.HUNTER],
			possibleCards: filterCards(
				Shimmerfly.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.HUNTER),
				input.options,
			),
		};
	},
};
