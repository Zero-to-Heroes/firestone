import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getEnchantmentsForEntity, getEntityTag } from '../../../services/parser-entity-utils';
import { GlobalHighlightCard } from './_registers';

export const HungeringAncient: GlobalHighlightCard = {
	cardIds: [CardIds.HungeringAncient_EDR_494],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const currentEntities = gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];

		const eatenEntityIds = getEnchantmentsForEntity(currentEntities, entityId)
			.filter((e) => e.CardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e)
			.map((e) => getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1))
			.filter((id) => id > 0);
		const eatenEntities = eatenEntityIds.map((id) => currentEntities.get(id)).filter((e) => !!e);
		const eatenCards = eatenEntities.map((e) => e!.CardId);
		return eatenCards;
	},
};
