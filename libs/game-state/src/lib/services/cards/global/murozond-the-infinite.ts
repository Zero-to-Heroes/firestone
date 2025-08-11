import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const MurozondTheInfinite: GlobalHighlightCard = {
	cardIds: [CardIds.MurozondTheInfinite_DRG_090, CardIds.MurozondTheInfinite_CORE_DRG_090],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.cardsPlayedLastTurn.map((e) => e.cardId);
	},
};
