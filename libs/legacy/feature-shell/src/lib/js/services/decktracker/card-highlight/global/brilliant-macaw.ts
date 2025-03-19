import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const BrilliantMacaw: GlobalHighlightCard = {
	cardIds: [CardIds.BrilliantMacaw],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const lastBattlecryCardId = deckState.cardsPlayedThisMatch
			.filter((card) => {
				const ref = allCards.getCard(card.cardId);
				return !!ref.mechanics?.length && ref.mechanics.includes('BATTLECRY');
			})
			// Because we want to know what card the macaw copies, so if we play two macaws in a row we still
			// want the info
			.filter((card) => card.cardId !== CardIds.BrilliantMacaw)
			.pop()?.cardId;
		return lastBattlecryCardId ? [lastBattlecryCardId] : [];
	},
};
