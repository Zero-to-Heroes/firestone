/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const ArcaneBrilliance: GeneratingCard = {
	cardIds: [CardIds.ArcaneBrilliance],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cardType: CardType.SPELL,
				cost: 7,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 7),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cardType: CardType.SPELL,
				cost: 8,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 8),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.SPELL,
				cost: 9,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 9),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cardType: CardType.SPELL,
				cost: 10,
				possibleCards: filterCards(
					ArcaneBrilliance.cardIds[0],
					input.allCards,
					(c) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', 10),
					input.options,
				),
			};
		}
		return null;
	},
};
