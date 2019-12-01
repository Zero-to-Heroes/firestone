import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class MinionBackOnBoardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent): boolean {
		return gameEvent.type === GameEvent.MINION_BACK_ON_BOARD;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.otherZone, cardId, entityId);

		// const debug = entityId === 3719;
		// if (debug) {
		// 	console.debug('handling minion back on board', entityId, card);
		// }

		const newOtherZone: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			deck.otherZone,
			cardId,
			entityId,
		);
		const cardWithZone = card.update({
			zone: 'PLAY',
		} as DeckCard);

		const newBoard: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.board, cardWithZone);
		// if (debug) {
		// 	console.debug('added card to board', newBoard);
		// }
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOtherZone,
			board: newBoard,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.MINION_BACK_ON_BOARD;
	}
}
