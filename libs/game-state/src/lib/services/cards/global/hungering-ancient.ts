import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const HungeringAncient: GlobalHighlightCard = {
	cardIds: [CardIds.HungeringAncient_EDR_494],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		const ancient = deckState.AllEntities.find((e) => e.entityId === entityId);
		if (!ancient) {
			return [];
		}

		const eatenEntityIds = ancient.enchantments
			.filter((e) => e.cardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e)
			.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value)
			.filter((id) => id);
		const eatenEntities = deckState.AllEntities.filter((e) => eatenEntityIds.includes(e.entityId));
		const eatenCards = eatenEntities.map((e) => e.cardId);
		return eatenCards;
	},
};
