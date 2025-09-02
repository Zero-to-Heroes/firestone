import { CardIds, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const SuccombToMadness: GlobalHighlightCard = {
	cardIds: [CardIds.SuccumbToMadness_EDR_455],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.filter((e) =>
					hasCorrectTribe(getProcessedCard(e.cardId, e.entityId, deckState, allCards), Race.DRAGON),
				)
				.map((e) => e.cardId)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
