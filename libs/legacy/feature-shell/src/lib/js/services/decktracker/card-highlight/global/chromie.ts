import { GameState } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';
import { CardIds } from '@firestone-hs/reference-data';

export const Chromie: GlobalHighlightCard = {
	cardIds: [CardIds.Chromie_TIME_103],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		// Should this also show only the cards that are still in the deck?
		// Probably not for the opponent, maybe for the player?
		return deckState.cardsPlayedThisMatch.map((e) => e.cardId);
	},
};
