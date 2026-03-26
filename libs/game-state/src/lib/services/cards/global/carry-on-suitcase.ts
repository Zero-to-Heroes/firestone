import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const CarryOnSuitcase: GlobalHighlightCard = {
	cardIds: [CardIds.CarryOnGrub_CarryOnSuitcaseToken_VAC_935t],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];
		const entity = currentEntities.get(entityId);
		if (!entity) {
			return [];
		}

		const linkedEntity1 = getEntityTag(entity, GameTag.CARDTEXT_ENTITY_0);
		const linkedEntity2 = getEntityTag(entity, GameTag.CARDTEXT_ENTITY_1);
		const cardIds = [
			linkedEntity1 > 0 ? currentEntities.get(linkedEntity1)?.CardId : undefined,
			linkedEntity2 > 0 ? currentEntities.get(linkedEntity2)?.CardId : undefined,
		].filter((id) => id);
		return cardIds as readonly string[];
	},
};
