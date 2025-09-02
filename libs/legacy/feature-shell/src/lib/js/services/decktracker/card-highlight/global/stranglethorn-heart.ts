import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const StranglethornHeart: GlobalHighlightCard = {
	cardIds: [CardIds.StranglethornHeart],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasCorrectTribe(c, Race.BEAST) && c.cost >= 5)
			.map((e) => e.id);
	},
};
