import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { GlobalHighlightCard } from './_registers';

export const StarlightWhelp: GlobalHighlightCard = {
	cardIds: [CardIds.StarlightWhelp],
	getRelatedCards: (entityId: number, side: HighlightSide, gameState: GameState, allCards: CardsFacadeService) => {
		const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return (
			deckState.cardsInStartingHand
				?.filter((c) => !allCards.getCard(c.cardId).isCoin)
				?.map((c) => c.cardId ?? deckState.findCard(c.entityId)?.card?.cardId)
				// To make sure we get the non-transformed version of the card
				// TODO: this might still be an issue with transformed cards, eg a card turned into
				// frog with Hex?
				.map((cardId) => getBaseCardId(cardId, allCards.getService())) ?? []
		);
	},
};
