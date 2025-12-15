/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const TrickySatyr: GeneratingCard = {
	cardIds: [CardIds.TrickySatyr_EDR_521],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const opponentHand = input.opponentDeckState.hand?.filter((c) => !!c?.cardId) ?? [];
		const getCost = (card: DeckCard) => {
			const refCard = input.allCards.getCard(card.cardId);
			return card.getEffectiveManaCost() ?? refCard.cost;
		};
		const lowestCost = opponentHand.sort((a, b) => getCost(a) - getCost(b))[0];
		const lowestCostCards = opponentHand.filter((c) => getCost(c) === getCost(lowestCost));
		return {
			possibleCards: lowestCostCards.map((c) => c.cardId),
		};
	},
};
