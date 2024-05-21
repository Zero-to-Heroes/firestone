import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromBoardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

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
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(previousOtherZone, cardWithZone);
		const newDeck = enhanceCardInDeck(
			deck.deck,
			cardId,
			entityId,
			gameEvent.additionalData.removedByCardId,
			gameEvent.additionalData.removedByEntityId,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
			otherZone: newOtherZone,
			deck: newDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_BOARD;
	}
}

const enhanceCardInDeck = (
	deck: readonly DeckCard[],
	cardId: string,
	entityId: number,
	removedByCardId: string,
	removedByEntityId: number,
): readonly DeckCard[] => {
	switch (removedByCardId) {
		case CardIds.Repackage_TOY_879:
			return enhanceCardInDeckWithRepackage(deck, cardId, entityId, removedByCardId, removedByEntityId);
		default:
			return deck;
	}
};

const enhanceCardInDeckWithRepackage = (
	deck: readonly DeckCard[],
	cardId: string,
	entityId: number,
	removedByCardId: string,
	removedByEntityId: number,
): readonly DeckCard[] => {
	const repackageBox = deck
		.filter((card) => card.cardId === CardIds.Repackage_RepackagedBoxToken_TOY_879t)
		.sort((a, b) => b.entityId - a.entityId)[0];
	if (repackageBox) {
		const updatedBox = repackageBox.update({
			relatedCardIds: [...(repackageBox.relatedCardIds || []), cardId],
		});
		const newDeck = deck.map((card) => (card.entityId === repackageBox.entityId ? updatedBox : card));
		return newDeck;
	}
	return deck;
};
