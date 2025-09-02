import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const KragwaTheFrog: GlobalHighlightCard = {
	cardIds: [CardIds.KragwaTheFrog_CORE_TRL_345, CardIds.KragwaTheFrog_TRL_345],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.cardsPlayedLastTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => c.type?.toUpperCase() === CardType[CardType.SPELL])
			.map((e) => e.id);
	},
};
