import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const InfantryReanimator: GlobalHighlightCard = {
	cardIds: [CardIds.InfantryReanimator],
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
				.filter((c) => hasCorrectTribe(c, Race.UNDEAD))
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
