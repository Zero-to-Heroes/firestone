import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const FerociousFelbat: GlobalHighlightCard = {
	cardIds: [CardIds.FerociousFelbat_EDR_892],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.minionsDeadThisMatch
				.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
				.filter(
					(c) =>
						hasMechanic(c, GameTag.DEATHRATTLE) &&
						c.cost != null &&
						c.cost >= 5 &&
						c.id !== CardIds.FerociousFelbat_EDR_892,
				)
				.map((e) => e.id)
				// distinct
				.filter((value, index, self) => self.indexOf(value) === index)
		);
	},
};
