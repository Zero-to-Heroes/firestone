/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const GorgonzormuDeliciousCheese: GeneratingCard = {
	cardIds: [CardIds.Gorgonzormu_DeliciousCheeseToken_VAC_955t],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const createdAtTurn = input.card.metaInfo?.turnAtWhichCardEnteredHand as number;
		const turnsInHand = (input.gameState.currentTurn as number) - createdAtTurn;
		const cheeseCost = Math.min(10, 1 + turnsInHand);
		const possibleCards = filterCards(
			GorgonzormuDeliciousCheese.cardIds[0],
			input.allCards,
			(c) => c.cost === cheeseCost && hasCorrectType(c, CardType.MINION),
			input.options,
		);
		return {
			cost: cheeseCost,
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
