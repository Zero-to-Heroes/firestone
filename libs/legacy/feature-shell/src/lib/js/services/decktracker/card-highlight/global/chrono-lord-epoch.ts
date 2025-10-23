import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';
import { TempCardIds } from '@firestone/shared/common/service';

export const ChronoLordEpoch: GlobalHighlightCard = {
	cardIds: [CardIds.ChronoLordEpoch_TIME_714],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.cardsPlayedLastTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => c.type?.toUpperCase() === CardType[CardType.MINION])
			.map((e) => e.id);
	},
};
