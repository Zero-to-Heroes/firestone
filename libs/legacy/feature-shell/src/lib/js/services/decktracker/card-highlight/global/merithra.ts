import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Merithra: GlobalHighlightCard = {
	cardIds: [CardIds.Merithra_EDR_238],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.filter((e) => allCards.getCard(e.cardId).cost >= 8)
				.map((e) => e.cardId)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
