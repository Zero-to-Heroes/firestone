import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class AssignCardIdParser implements EventParser {
	constructor() {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent): boolean {
		return [GameEvent.HEALING].indexOf(gameEvent.type) !== -1;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('trying to assign card id?', gameEvent);
		const cardId = gameEvent.additionalData.sourceCardId;
		const entityId = gameEvent.additionalData.sourceEntityId;
		const localPlayer = gameEvent.localPlayer;
		const controllerId = gameEvent.additionalData.sourceControllerId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		console.log('assigning card id?', cardId, entityId, isPlayer, deck);
		const newPlayerDeck = DeckManipulationHelper.assignCardIdToEntity(deck, entityId, cardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return DeckEvents.CARD_ID_ASSIGNED;
	}
}
