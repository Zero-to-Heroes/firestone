import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const HabeasCorpses: GlobalHighlightCard = {
	cardIds: [CardIds.HabeasCorpses, CardIds.HabeasCorpses_CORE_MAW_002],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch.map((e) => e.cardId);
	},
};
