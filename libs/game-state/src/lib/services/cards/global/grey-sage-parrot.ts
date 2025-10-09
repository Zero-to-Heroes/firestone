import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const GreySageParrot: GlobalHighlightCard = {
	cardIds: [CardIds.GreySageParrot],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const costThreshold = 6;

		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: ReferenceCard | undefined = deckState.cardsPlayedThisMatch
			.map((card) => getProcessedCard(card.cardId, card.entityId, deckState, allCards))
			.filter((card) => card.type?.toLowerCase() === 'spell')
			.filter((card) => card.cost != null && card.cost >= costThreshold)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		return [candidate.id];
	},
};
