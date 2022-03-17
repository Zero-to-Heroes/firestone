import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { EventParser } from './event-parser';

export class ReconnectStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.RECONNECT_START;
	}

	async parse(currentState: GameState, gameEvent: DeckstringOverrideEvent): Promise<GameState> {
		console.debug('[reconnect-start-parser] applying reconnect start event', gameEvent, currentState);
		return currentState.update({
			reconnectOngoing: true,
		});
	}

	event(): string {
		return GameEvent.RECONNECT_START;
	}
}
