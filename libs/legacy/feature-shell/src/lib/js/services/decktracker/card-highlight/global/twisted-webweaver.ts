import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TwistedWebweaver: GlobalHighlightCard = {
	cardIds: [CardIds.TwistedWebweaver_EDR_540],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.cardsPlayedThisMatch
				.filter(
					(e) =>
						getProcessedCard(e.cardId, e.entityId, deckState, allCards).type === CardType[CardType.MINION],
				)
				.map((e) => e.cardId)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
