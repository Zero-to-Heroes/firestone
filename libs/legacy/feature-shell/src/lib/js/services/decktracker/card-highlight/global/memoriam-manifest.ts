import { hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { TempCardIds } from '@firestone/shared/common/service';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const MemoriamManifest: GlobalHighlightCard = {
	cardIds: [TempCardIds.MemoriamManifest],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidates = deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasCorrectTribe(c, Race.UNDEAD));
		const highestCost = candidates.reduce((max, c) => Math.max(max, c.cost), 0);
		return candidates.filter((c) => c.cost === highestCost).map((e) => e.id);
	},
};
