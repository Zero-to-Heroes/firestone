import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const PetParrot: GlobalHighlightCard = {
	cardIds: [CardIds.PetParrot_VAC_961],
	getRelatedCards: (
		entityId: number,
		side: 'player' | 'opponent' | 'single',
		gameState: GameState,
		allCards: CardsFacadeService,
	) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: ReferenceCard = deckState.cardsPlayedThisMatch
			.map((card) => allCards.getCard(card.cardId))
			.filter((card) => card.cost === 1)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		return [candidate.id];
	},
};
