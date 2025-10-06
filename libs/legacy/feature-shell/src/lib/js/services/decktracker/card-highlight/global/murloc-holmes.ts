import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const MurlocHolmes: GlobalHighlightCard = {
	cardIds: [CardIds.MurlocHolmes_CORE_REV_022, CardIds.MurlocHolmes_REV_022, CardIds.MurlocHolmes_REV_770],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		// We want to know the other player's starting hand
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		const startingHandEntityIds = deckState.cardsInStartingHand?.map((c) => c.entityId) ?? [];
		return startingHandEntityIds.map((entityId) => deckState.findCard(entityId)?.card?.cardId);
	},
};
