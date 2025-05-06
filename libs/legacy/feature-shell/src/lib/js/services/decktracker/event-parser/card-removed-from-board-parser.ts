import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromBoardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.board, cardId, entityId);
		// Happens when the removed card is not a minion
		// Event might have to be updated so that this does not happen though
		if (!card) {
			console.warn('Trying to remove non-existing card', cardId);
			return currentState;
		}

		const previousBoard = deck.board;
		const newBoard: readonly DeckCard[] = this.helper.removeSingleCardFromZone(previousBoard, cardId, entityId)[0];
		const cardWithZone = card.update({
			zone: 'REMOVEDFROMGAME',
		} as DeckCard);
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck,
			cardWithZone,
			this.allCards,
		);
		const newPlayerDeck = deck.update({
			board: newBoard,
			otherZone: newOtherZone,
			// Reno removes cards from board, but that doesn't count as "cards destroyed in deck"
			// destroyedCardsInDeck: [...deck.destroyedCardsInDeck, { cardId, entityId }],
		});

		const newState = currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
		const enhancedState = enhanceCardInDeck(
			cardId,
			entityId,
			gameEvent.additionalData.removedByCardId,
			gameEvent.additionalData.removedByEntityId,
			newState,
		);
		// console.debug('returning enhanced state', enhancedState);
		return enhancedState;
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_BOARD;
	}
}

const enhanceCardInDeck = (
	cardId: string,
	entityId: number,
	removedByCardId: string,
	removedByEntityId: number,
	currentState: GameState,
): GameState => {
	const isRemovedByPlayer = currentState.playerDeck.otherZone.some((c) => Math.abs(c.entityId) === removedByEntityId);
	// console.debug('removal source', isRemovedByPlayer, removedByCardId, removedByEntityId);
	switch (removedByCardId) {
		case CardIds.Repackage_TOY_879:
			const newDeck = enhanceCardInDeckWithRepackage(
				// We create the card in the opponent's deck
				isRemovedByPlayer ? currentState.opponentDeck : currentState.playerDeck,
				cardId,
				entityId,
				removedByCardId,
				removedByEntityId,
			);
			// console.debug('enhanced deck', newDeck);
			return currentState.update({
				[isRemovedByPlayer ? 'opponentDeck' : 'playerDeck']: newDeck,
			});
		default:
			return currentState;
	}
};

const enhanceCardInDeckWithRepackage = (
	deck: DeckState,
	cardId: string,
	entityId: number,
	removedByCardId: string,
	removedByEntityId: number,
): DeckState => {
	const repackageBox = deck.deck
		.filter((card) => card.cardId === CardIds.Repackage_RepackagedBoxToken_TOY_879t)
		.sort((a, b) => b.entityId - a.entityId)[0];
	if (repackageBox) {
		const updatedBox = repackageBox.update({
			relatedCardIds: [...(repackageBox.relatedCardIds || []), cardId],
		});
		const newDeck = deck.deck.map((card) => (card.entityId === repackageBox.entityId ? updatedBox : card));
		return deck.update({
			deck: newDeck,
		});
	}
	return deck;
};
