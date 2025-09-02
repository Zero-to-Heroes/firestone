import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const AsvedonTheGrandshield: GlobalHighlightCard = {
	cardIds: [CardIds.AsvedonTheGrandshield],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.spellsPlayedThisMatch.length
			? [deckState.spellsPlayedThisMatch[deckState.spellsPlayedThisMatch.length - 1].cardId]
			: [];
	},
};
