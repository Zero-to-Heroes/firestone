import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const UrsolsAura: GlobalHighlightCard = {
	cardIds: [CardIds.Ursol_UrsolsAura_EDR_259e1],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const fullDeckState = side === 'player' ? gameState.fullGameState.Player : gameState.fullGameState.Opponent;
		const ursolAuraCard = fullDeckState.Secrets.find((e) => e.entityId === entityId);
		console.debug(
			'[debug] [ursols-aura] ursolAuraCard',
			ursolAuraCard,
			fullDeckState.Secrets,
			entityId,
			fullDeckState,
		);
		if (!ursolAuraCard) {
			return [];
		}

		const replayedCardEntityId = ursolAuraCard.tags.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_ENT_1)?.Value;
		const replayedCard = deckState.findCard(replayedCardEntityId)?.card;
		return replayedCard ? [replayedCard.cardId] : [];
	},
};
