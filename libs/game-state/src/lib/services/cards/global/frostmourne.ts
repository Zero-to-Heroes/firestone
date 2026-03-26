import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEnchantmentsForEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const Frostmourne: GlobalHighlightCard = {
	cardIds: [CardIds.Frostmourne_CORE_RLK_086, CardIds.Frostmourne_RLK_086],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];

		const trappedSoulsEntityIds = getEnchantmentsForEntity(currentEntities, entityId)
			.filter((e) => e.CardId === CardIds.Frostmourne_TrappedSoulEnchantment)
			.map((e) => getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1))
			.filter((id) => id > 0);

		const trappedSouls = trappedSoulsEntityIds
			.map((id) => currentEntities.get(id))
			.filter((e) => !!e);
		return trappedSouls.map((e) => e!.CardId);
	},
};
