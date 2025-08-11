import { CardIds } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const TramHeist: GlobalHighlightCard = {
	cardIds: [CardIds.TramHeist_WW_053],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.cardsPlayedLastTurn.map((card) => card.cardId);
	},
};
