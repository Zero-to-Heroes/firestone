import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Ursoc: GlobalHighlightCard = {
	cardIds: [CardIds.Ursoc_EDR_819],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		const ursoc = deckState.AllEntities.find((e) => e.entityId === entityId);
		const enchantments =
			ursoc.enchantments?.filter((e) => e.cardId === CardIds.Ursoc_DefeatedSpiritEnchantment_EDR_819e) ?? [];
		const willResurrectEntityIds = enchantments
			.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value)
			.filter((e) => e);
		const willResurrectCardIds = [
			...gameState.fullGameState.Player.AllEntities,
			...gameState.fullGameState.Opponent.AllEntities,
		]
			.filter((e) => willResurrectEntityIds.includes(e.entityId))
			.map((e) => e.cardId);
		return willResurrectCardIds;
	},
};
