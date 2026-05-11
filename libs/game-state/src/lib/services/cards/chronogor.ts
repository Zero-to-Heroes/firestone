/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const Chronogor: GeneratingCard = {
	cardIds: [CardIds.Chronogor_TIME_032],
	publicTutor: true,
	hasSequenceInfo: false, // We actually don't need to show the sequence info in hand
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const lowestCost = [...input.opponentDeckState.deck].sort(
			(a, b) => (a.getEffectiveManaCost() ?? 0) - (b.getEffectiveManaCost() ?? 0),
		)[0];
		const lowestCostCards = [...input.opponentDeckState.deck].filter(
			(c) => (c.getEffectiveManaCost() ?? 0) === (lowestCost.getEffectiveManaCost() ?? 0),
		);
		if (input.card.createdIndex === 2) {
			return {
				possibleCards: lowestCostCards
					.map((c) => c.cardId)
					.filter((c, index, self) => self.indexOf(c) === index),
			};
		}
		if (input.card.createdIndex === 3) {
			if (lowestCostCards.length > 1) {
				return {
					possibleCards: lowestCostCards
						.map((c) => c.cardId)
						.filter((c, index, self) => self.indexOf(c) === index),
				};
			} else {
				const secondLowestCost = input.opponentDeckState.deck
					.filter((c) => (c.getEffectiveManaCost() ?? 0) !== (lowestCost.getEffectiveManaCost() ?? 0))
					.sort((a, b) => (a.getEffectiveManaCost() ?? 0) - (b.getEffectiveManaCost() ?? 0))[0];
				const secondLowestCostCards = input.opponentDeckState.deck.filter(
					(c) => c.getEffectiveManaCost() === secondLowestCost.getEffectiveManaCost(),
				);
				return {
					possibleCards: secondLowestCostCards
						.map((c) => c.cardId)
						.filter((c, index, self) => self.indexOf(c) === index),
				};
			}
		}

		return null;
	},
};
