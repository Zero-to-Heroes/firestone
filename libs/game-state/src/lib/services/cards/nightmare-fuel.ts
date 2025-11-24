/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

export const NightmareFuel: GeneratingCard = {
	cardIds: [CardIds.NightmareFuel_EDR_528],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const knownCardsInOpponentDeck = input.opponentDeckState.deck
			.map((c) => c.cardId)
			.filter((c) => !!c)
			.filter((c) => input.allCards.getCard(c)?.type?.toUpperCase() === CardType[CardType.MINION]);
		return {
			possibleCards: knownCardsInOpponentDeck,
		};
	},
};
