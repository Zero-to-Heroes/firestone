import { GameState } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Chromie: GlobalHighlightCard = {
	cardIds: [TempCardIds.Chromie_TIME],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedThisMatch.map((e) => e.cardId);
	},
};
