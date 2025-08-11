import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const WakenerOfSouls: GlobalHighlightCard = {
	cardIds: [CardIds.WakenerOfSouls_GDB_468],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deckState.minionsDeadThisMatch
			.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
			.filter((c) => hasMechanic(c, GameTag.DEATHRATTLE))
			.map((e) => e.id)
			.filter((id) => id != CardIds.WakenerOfSouls_GDB_468);
	},
};
