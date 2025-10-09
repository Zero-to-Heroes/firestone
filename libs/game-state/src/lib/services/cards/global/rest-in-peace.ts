import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';

import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GlobalHighlightCard } from './_registers';

export const RestInPeace: GlobalHighlightCard = {
	cardIds: [CardIds.RestInPeace_VAC_457],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const otherDeckState = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		const highestCostMinionDeck = getHighestCostMinions(deckState, allCards);
		const highestCostMinionOtherDeck = getHighestCostMinions(otherDeckState, allCards);
		return [...highestCostMinionDeck, ...highestCostMinionOtherDeck].filter((c) => c !== null).map((c) => c.id);
	},
};

const getHighestCostMinions = (deckState: DeckState, allCards: CardsFacadeService): ReferenceCard[] => {
	const deadCards = deckState.minionsDeadThisMatch
		.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
		.filter((c) => c.cost != null);
	const highestCost = deadCards.sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0)).pop()?.cost;
	if (highestCost == null) {
		return [];
	}
	return deadCards.filter((c) => c.cost === highestCost);
};
