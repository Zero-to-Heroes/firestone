/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { Metadata } from '../../models/metadata';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';
import { filterCards } from './utils';

export const Synthesize: GeneratingCard = {
	cardIds: [CardIds.Synthesize],
	hasSequenceInfo: true,
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (input.card.createdIndex === 0) {
			return {
				cost: 1,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 1),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 1) {
			return {
				cost: 2,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 2),
					input.options,
				),
			};
		} else if (input.card.createdIndex === 2) {
			return {
				cost: 3,
				cardType: CardType.MINION,
				races: [Race.ELEMENTAL],
				possibleCards: filterCards(
					Synthesize.cardIds[0],
					input.allCards,
					(c) =>
						hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && hasCost(c, '==', 3),
					input.options,
				),
			};
		}
		return null;
	},
};
