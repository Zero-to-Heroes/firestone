import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const WakenerOfSouls: GlobalHighlightCard = {
	cardIds: [CardIds.WakenerOfSouls_GDB_468],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.filter((c) => hasMechanic(c, GameTag.DEATHRATTLE))
				.map((e) => e.id)
				.filter((id) => id != CardIds.WakenerOfSouls_GDB_468)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
