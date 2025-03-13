import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const FerociousFelbat: GlobalHighlightCard = {
	cardIds: [CardIds.FerociousFelbat_EDR_892],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => allCards.getCard(e.cardId))
				.filter((c) => hasMechanic(c, GameTag.DEATHRATTLE) && c.cost != null && c.cost >= 5)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
