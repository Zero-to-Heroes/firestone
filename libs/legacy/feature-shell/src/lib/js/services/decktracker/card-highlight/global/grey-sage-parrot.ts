import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
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
			.map((card) => allCards.getCard(card.cardId))
			.filter((card) => card.type?.toLowerCase() === 'spell')
			.filter((card) => card.cost >= costThreshold)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		return [candidate.id];
	},
};
