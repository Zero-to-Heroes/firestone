import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const PetParrot: GlobalHighlightCard = {
	cardIds: [CardIds.PetParrot_VAC_961],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const candidate: ReferenceCard = deckState.cardsPlayedThisMatch
			.map((card) => getProcessedCard(card.cardId, card.entityId, deckState, allCards))
			.filter((card) => card.cost === 1)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		return [candidate.id];
	},
};
