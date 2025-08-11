import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const InventorBoom: GlobalHighlightCard = {
	cardIds: [CardIds.InventorBoom_TOY_607],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => ({ entityId: e.entityId, card: getProcessedCard(e.cardId, e.entityId, deckState, allCards) }))
			.filter((c) => hasCorrectTribe(c.card, Race.MECH) && c.card.cost != null && c.card.cost >= 5)
			.map((e) => ({ cardId: e.card.id, entityId: e.entityId }));
	},
};
