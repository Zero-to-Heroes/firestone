import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const ChattyMacaw: GlobalHighlightCard = {
	cardIds: [CardIds.ChattyMacaw_VAC_407],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const lastSpellOnEnemy = deckState.spellsPlayedOnEnemyEntities?.at(-1) ?? null;
		return lastSpellOnEnemy ? [{ cardId: lastSpellOnEnemy.cardId, entityId: lastSpellOnEnemy.entityId }] : null;
	},
};
