import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Rewind: GlobalHighlightCard = {
	cardIds: [CardIds.Rewind_ETC_532],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.spellsPlayedThisMatch.map((e) => e.cardId).filter((c) => c !== CardIds.Rewind_ETC_532);
	},
};
