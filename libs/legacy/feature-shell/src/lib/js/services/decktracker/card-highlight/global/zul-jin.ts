import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Zuljin: GlobalHighlightCard = {
	cardIds: [CardIds.Zuljin],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const spellsPlayedThisGame = deckState.spellsPlayedThisMatch.map((c) => c.cardId);
		return [...spellsPlayedThisGame, CardIds.Zuljin_BerserkerThrowHeroic];
	},
};
