import { CardIds } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const NzothGodOfTheDeep: GlobalHighlightCard = {
	cardIds: [CardIds.NzothGodOfTheDeep],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.filter((c) => !!c.races?.length)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
