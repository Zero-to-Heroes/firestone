import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const TwistedWebweaver: GlobalHighlightCard = {
	cardIds: [CardIds.TwistedWebweaver_EDR_540],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.cardsPlayedThisMatch
				.filter((e) => allCards.getCard(e.cardId).type === CardType[CardType.MINION])
				.map((e) => e.cardId)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
