import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardRemovedFromBoardParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

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
			deck.otherZone,
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
		return newState;
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_BOARD;
	}
}
