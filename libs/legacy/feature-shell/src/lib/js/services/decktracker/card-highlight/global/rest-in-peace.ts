import { CardIds } from '@firestone-hs/reference-data';
import { DeckState, GameState, getProcessedCard } from '@firestone/game-state';
import { pickLast } from '@firestone/shared/framework/common';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const RestInPeace: GlobalHighlightCard = {
	cardIds: [CardIds.RestInPeace_VAC_457],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = gameState.playerDeck;
		const otherDeckState = gameState.opponentDeck;
		const highestCostMinionDeck = getHighestCostMinions(deckState, allCards);
		const highestCostMinionOtherDeck = getHighestCostMinions(otherDeckState, allCards);
		return [
			deckState.hero?.cardId,
			...highestCostMinionDeck,
			otherDeckState.hero?.cardId,
			...highestCostMinionOtherDeck,
		].filter((c) => c !== null);
	},
};

const getHighestCostMinions = (deckState: DeckState, allCards: CardsFacadeService): string[] => {
	const deadCards = deckState.minionsDeadThisMatch
		.map((e) => getProcessedCard(e.cardId, e.entityId, deckState, allCards))
		.filter((c) => c.cost != null);
	const highestCost = pickLast(deadCards.sort((a, b) => a.cost - b.cost))?.cost;
	if (highestCost == null) {
		return [];
	}
	return deadCards.filter((c) => c.cost === highestCost).map((c) => c.id);
};
