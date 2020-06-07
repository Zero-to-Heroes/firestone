import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRemovedFromBoardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_REMOVED_FROM_BOARD;
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
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
			otherZone: newOtherZone,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REMOVED_FROM_BOARD;
	}
}
