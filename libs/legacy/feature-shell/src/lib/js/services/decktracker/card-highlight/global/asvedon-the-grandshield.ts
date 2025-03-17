import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const AsvedonTheGrandshield: GlobalHighlightCard = {
	cardIds: [CardIds.MurozondTheInfinite_DRG_090, CardIds.MurozondTheInfinite_CORE_DRG_090],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.spellsPlayedThisMatch.length
			? [deckState.spellsPlayedThisMatch[deckState.spellsPlayedThisMatch.length - 1].cardId]
			: [];
	},
};
