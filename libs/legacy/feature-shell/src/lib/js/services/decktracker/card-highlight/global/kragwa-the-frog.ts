import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const KragwaTheFrog: GlobalHighlightCard = {
	cardIds: [CardIds.KragwaTheFrog_CORE_TRL_345, CardIds.KragwaTheFrog_TRL_345],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedLastTurn
			.map((e) => allCards.getCard(e.cardId))
			.filter((c) => c.type?.toUpperCase() === CardType[CardType.SPELL])
			.map((e) => e.id);
	},
};
