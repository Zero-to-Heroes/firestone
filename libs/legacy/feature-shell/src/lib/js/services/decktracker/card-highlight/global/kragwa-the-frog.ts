import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const KragwaTheFrog: GlobalHighlightCard = {
	cardIds: [CardIds.KragwaTheFrog_CORE_TRL_345, CardIds.KragwaTheFrog_TRL_345],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const historySide: 'player' | 'opponent' = side === 'opponent' ? 'opponent' : 'player';
		const historyCards =
			gameState.cardsPlayedThisMatch?.filter(
				(card) => card.side === historySide && card.turn === gameState.currentTurnNumeric - 1,
			) ?? [];
		const historySpells = historyCards
			.map((card) => getProcessedCard(card.cardId, card.entityId, deckState, allCards))
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.SPELL])
			.map((card) => card.id);
		const lastTurnSpells = deckState.cardsPlayedLastTurn
			.map((card) => getProcessedCard(card.cardId, card.entityId, deckState, allCards))
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.SPELL])
			.map((card) => card.id);
		const combinedSpells = [...historySpells, ...lastTurnSpells];
		return Array.from(new Set(combinedSpells));
	},
};
