/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const Chronogor: GeneratingCard = {
	cardIds: [CardIds.Chronogor_TIME_032],
	publicTutor: true,
	hasSequenceInfo: false, // We actually don't need to show the sequence info in hand
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const lowestCost = [...input.opponentDeckState.deck].sort(
			(a, b) => a.getEffectiveManaCost() - b.getEffectiveManaCost(),
		)[0];
		const lowestCostCards = [...input.opponentDeckState.deck].filter(
			(c) => c.getEffectiveManaCost() === lowestCost.getEffectiveManaCost(),
		);
		if (input.card.createdIndex === 2) {
			return {
				possibleCards: lowestCostCards.map((c) => c.cardId),
			};
		}
		if (input.card.createdIndex === 3) {
			if (lowestCostCards.length > 1) {
				return {
					possibleCards: lowestCostCards.map((c) => c.cardId),
				};
			} else {
				const secondLowestCost = input.opponentDeckState.deck
					.filter((c) => c.getEffectiveManaCost() !== lowestCost.getEffectiveManaCost())
					.sort((a, b) => a.getEffectiveManaCost() - b.getEffectiveManaCost())[0];
				const secondLowestCostCards = input.opponentDeckState.deck.filter(
					(c) => c.getEffectiveManaCost() === secondLowestCost.getEffectiveManaCost(),
				);
				return {
					possibleCards: secondLowestCostCards.map((c) => c.cardId),
				};
			}
		}

		return null;
	},
};
