import { CardIds, CardType } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
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
