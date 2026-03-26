import { CardIds, GameTag } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEnchantmentsForEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const Ursoc: GlobalHighlightCard = {
	cardIds: [CardIds.Ursoc_EDR_819],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];
		const enchantments = getEnchantmentsForEntity(currentEntities, entityId)
			.filter((e) => e.CardId === CardIds.Ursoc_DefeatedSpiritEnchantment_EDR_819e);
		const willResurrectEntityIds = enchantments
			.map((e) => getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1))
			.filter((id) => id > 0);
		const willResurrectCardIds = willResurrectEntityIds
			.map((id) => currentEntities.get(id))
			.filter((e) => !!e)
			.map((e) => e!.CardId);
		return willResurrectCardIds;
	},
};
