import { CardIds, CardType } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const ChronoLordEpoch: GlobalHighlightCard = {
	cardIds: [CardIds.ChronoLordEpoch_TIME_714],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deckState.cardsPlayedLastTurn
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => c.type?.toUpperCase() === CardType[CardType.MINION])
			.map((e) => e.id);
	},
};
