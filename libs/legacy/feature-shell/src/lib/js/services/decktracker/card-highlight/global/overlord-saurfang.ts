import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const OverlordSaurfang: GlobalHighlightCard = {
	cardIds: [CardIds.OverlordSaurfang_BAR_334],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => allCards.getCard(e.cardId))
			.filter((c) => hasMechanic(c, GameTag.FRENZY))
			.map((e) => e.id);
	},
};
