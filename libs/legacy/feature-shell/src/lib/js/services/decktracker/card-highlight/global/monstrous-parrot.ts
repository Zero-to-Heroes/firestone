import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const MonstrousParrot: GlobalHighlightCard = {
	cardIds: [CardIds.MonstrousParrot],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.lastDeathrattleMinionDead?.cardId ? [deckState.lastDeathrattleMinionDead.cardId] : null;
	},
};
