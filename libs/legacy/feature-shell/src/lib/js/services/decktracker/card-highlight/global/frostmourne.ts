import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Frostmourne: GlobalHighlightCard = {
	cardIds: [CardIds.Frostmourne_CORE_RLK_086, CardIds.Frostmourne_RLK_086],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.fullGameState?.Player : gameState.fullGameState?.Opponent;
		if (!deckState) {
			return [];
		}

		const entity = deckState.AllEntities.find((e) => e.entityId === entityId);
		if (!entity) {
			return [];
		}

		const trappedSoulsEntityIds = entity.enchantments
			.filter((e) => e.cardId === CardIds.Frostmourne_TrappedSoulEnchantment)
			.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value);
		const enemyDeckState = side === 'player' ? gameState.fullGameState?.Opponent : gameState.fullGameState?.Player;
		if (!enemyDeckState) {
			return [];
		}

		const trappedSouls = enemyDeckState.AllEntities.filter((e) => trappedSoulsEntityIds.includes(e.entityId));
		return trappedSouls.map((e) => e.cardId);
	},
};
