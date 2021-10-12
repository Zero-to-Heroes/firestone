import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class AssignCardIdParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && [GameEvent.HEALING].indexOf(gameEvent.type) !== -1;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const cardId = gameEvent.additionalData.sourceCardId;
		const entityId = gameEvent.additionalData.sourceEntityId;
		const localPlayer = gameEvent.localPlayer;
		const controllerId = gameEvent.additionalData.sourceControllerId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newPlayerDeck = this.helper.assignCardIdToEntity(deck, entityId, cardId);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.HEALING;
	}
}
