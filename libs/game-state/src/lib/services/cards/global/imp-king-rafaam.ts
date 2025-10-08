import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const ImpKingRafaam: GlobalHighlightCard = {
	cardIds: [CardIds.ImpKingRafaam_REV_789, CardIds.ImpKingRafaam_REV_835, CardIds.ImpKingRafaam_ImpKingRafaamToken],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasMechanic(c, GameTag.IMP))
			.map((e) => e.id);
	},
};
