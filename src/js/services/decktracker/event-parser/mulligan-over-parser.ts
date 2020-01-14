import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class MulliganOverParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MULLIGAN_DONE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return Object.assign(new GameState(), currentState, {
			mulliganOver: true,
			currentTurn: 0,
		} as GameState);
	}

	event(): string {
		return DeckEvents.MULLIGAN_OVER;
	}
}
