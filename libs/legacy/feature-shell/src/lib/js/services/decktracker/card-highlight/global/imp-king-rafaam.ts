import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const ImpKingRafaam: GlobalHighlightCard = {
	cardIds: [CardIds.ImpKingRafaam_REV_789, CardIds.ImpKingRafaam_REV_835, CardIds.ImpKingRafaam_ImpKingRafaamToken],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => allCards.getCard(e.cardId))
			.filter((c) => hasMechanic(c, GameTag.IMP))
			.map((e) => e.id);
	},
};
