import { CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const EndbringerUmbra: GlobalHighlightCard = {
	cardIds: [CardIds.EndbringerUmbra_TLC_106],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasMechanic(c, GameTag.DEATHRATTLE) && c.type?.toUpperCase() === CardType[CardType.MINION])
			.map((e) => e.id);
	},
};
