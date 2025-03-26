import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const CarryOnSuitcase: GlobalHighlightCard = {
	cardIds: [CardIds.CarryOnGrub_CarryOnSuitcaseToken_VAC_935t],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		const entity = deckState.AllEntities.find((e) => e.entityId === entityId);
		if (!entity) {
			return [];
		}

		const linkedEntity1 = entity.tags?.find((tag) => tag.Name === GameTag.CARDTEXT_ENTITY_0)?.Value;
		const linkedEntity2 = entity.tags?.find((tag) => tag.Name === GameTag.CARDTEXT_ENTITY_1)?.Value;
		const cardIds = [
			deckState.AllEntities.find((e) => e.entityId === linkedEntity1)?.cardId,
			deckState.AllEntities.find((e) => e.entityId === linkedEntity2)?.cardId,
		].filter((id) => id);
		return cardIds;
	},
};
