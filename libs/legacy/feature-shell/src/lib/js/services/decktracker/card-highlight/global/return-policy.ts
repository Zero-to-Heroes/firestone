import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const ReturnPolicy: GlobalHighlightCard = {
	cardIds: [CardIds.ReturnPolicy_MIS_102],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedThisMatch
			.filter((c) =>
				getProcessedCard(c.cardId, c.entityId, deckState, allCards)?.mechanics?.includes(
					GameTag[GameTag.DEATHRATTLE],
				),
			)
			.map((c) => c.cardId);
	},
};
