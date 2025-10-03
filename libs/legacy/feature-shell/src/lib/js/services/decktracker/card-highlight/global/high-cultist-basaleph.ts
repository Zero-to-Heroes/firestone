import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const HighCultistBasaleph: GlobalHighlightCard = {
	cardIds: [CardIds.HighCultistBasaleph],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadSinceLastTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasCorrectTribe(c, Race.UNDEAD))
			.map((e) => e.id);
	},
};
