import { CardIds, GameTag, hasCorrectTribe, hasMechanic, Race } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const StranglethornHeart: GlobalHighlightCard = {
	cardIds: [CardIds.StranglethornHeart],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisTurn
			.map((e) => allCards.getCard(e.cardId))
			.filter((c) => hasCorrectTribe(c, Race.BEAST) && c.cost >= 5)
			.map((e) => e.id);
	},
};
