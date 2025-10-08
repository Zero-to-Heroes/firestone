import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const VanessaVanCleef: GlobalHighlightCard = {
	cardIds: [CardIds.VanessaVancleefLegacy, CardIds.VanessaVancleef_CORE_CS3_005],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		if (side === 'single' || side === 'arena-draft') {
			return [];
		}
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const lastPlayedCard: string = !!deckState.cardsPlayedThisMatch?.length
			? deckState.cardsPlayedThisMatch[deckState.cardsPlayedThisMatch.length - 1]?.cardId
			: null;
		if (!lastPlayedCard) {
			return null;
		}
		return [lastPlayedCard];
	},
};
