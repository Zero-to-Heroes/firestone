import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const RavenousFelhunter: GlobalHighlightCard = {
	cardIds: [CardIds.RavenousFelhunter_EDR_891],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.filter((c) => hasMechanic(c, GameTag.DEATHRATTLE) && c.cost != null && c.cost <= 4)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
