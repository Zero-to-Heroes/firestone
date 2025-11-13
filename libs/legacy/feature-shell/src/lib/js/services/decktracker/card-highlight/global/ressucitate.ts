import { CardIds } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const Ressucitate: GlobalHighlightCard = {
	cardIds: [CardIds.Resuscitate_TLC_818],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.filter((c) => c.cost >= 1 && c.cost <= 3)
				.sort((a, b) => a.cost - b.cost)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
