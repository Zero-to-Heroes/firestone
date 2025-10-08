import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GlobalHighlightCard } from './_registers';

export const GrotesqueRuneblade: GlobalHighlightCard = {
	cardIds: [CardIds.GrotesqueRuneblade_EDR_812],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const card = [...deckState.cardsPlayedThisMatch].reverse().find((c) => hasRune(c, allCards));
		return !!card ? [card.cardId] : null;
	},
};

const hasRune = (card: { cardId: string }, allCards: CardsFacadeService): boolean => {
	const referenceCard = allCards.getCard(card.cardId);
	return !!referenceCard?.additionalCosts?.BLOODRUNE || !!referenceCard?.additionalCosts?.UNHOLYRUNE;
};
