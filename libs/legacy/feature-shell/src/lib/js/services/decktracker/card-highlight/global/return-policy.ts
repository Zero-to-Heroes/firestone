import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const ReturnPolicy: GlobalHighlightCard = {
	cardIds: [CardIds.ReturnPolicy_MIS_102],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedThisMatch
			.filter((c) => allCards.getCard(c.cardId)?.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]))
			.map((c) => c.cardId);
	},
};
