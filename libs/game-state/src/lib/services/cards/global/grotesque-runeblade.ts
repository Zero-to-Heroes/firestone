import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const GrotesqueRuneblade: GlobalHighlightCard = {
	cardIds: [CardIds.GrotesqueRuneblade_EDR_812],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const card = [...deckState.cardsPlayedThisMatch].reverse()[0];
		return !!card ? [card.cardId] : null;
	},
};
