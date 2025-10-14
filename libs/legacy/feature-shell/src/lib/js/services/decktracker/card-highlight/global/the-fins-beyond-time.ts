import { GameState } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TheFinsBeyondTime: GlobalHighlightCard = {
	cardIds: [TempCardIds.TheFinsBeyondTime],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsInStartingHand?.map((c) => c.cardId) ?? [];
	},
};
