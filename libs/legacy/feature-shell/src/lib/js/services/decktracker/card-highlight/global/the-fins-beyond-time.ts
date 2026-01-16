import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TheFinsBeyondTime: GlobalHighlightCard = {
	cardIds: [CardIds.TheFinsBeyondTime_TIME_706],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.cardsInStartingHand?.map((c) => c.cardId ?? deckState.findCard(c.entityId)?.card?.cardId) ?? []
		);
	},
};
