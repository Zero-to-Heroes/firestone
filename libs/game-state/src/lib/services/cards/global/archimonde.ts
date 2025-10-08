import { CardIds, Race } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Archimonde: GlobalHighlightCard = {
	cardIds: [CardIds.Archimonde_GDB_128],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedThisMatch
			.filter(
				(c) =>
					allCards.getCard(c.cardId).races?.includes(Race[Race.DEMON]) ||
					allCards.getCard(c.cardId).races?.includes(Race[Race.ALL]),
			)
			.map((c) => deckState.findCard(c.entityId)?.card)
			.filter((c) => !!c)
			.filter((c) => c.creatorCardId != null || c.stolenFromOpponent)
			.map((c) => c.cardId);
	},
};
