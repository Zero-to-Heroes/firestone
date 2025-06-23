import { GameState } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Ressucitate: GlobalHighlightCard = {
	cardIds: [TempCardIds.Ressucitate],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisTurn
				.map((e) => allCards.getCard(e.cardId))
				.filter((c) => c.cost >= 1 && c.cost <= 3)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
