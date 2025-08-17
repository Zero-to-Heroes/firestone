import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const GreySageParrot: GlobalHighlightCard = {
	cardIds: [CardIds.GreySageParrot],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const costThreshold = 6;

		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: ReferenceCard = deckState.cardsPlayedThisMatch
			.map((card) => getProcessedCard(card.cardId, card.entityId, deckState, allCards))
			.filter((card) => card.type?.toLowerCase() === 'spell')
			.filter((card) => card.cost >= costThreshold)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		return [candidate.id];
	},
};
