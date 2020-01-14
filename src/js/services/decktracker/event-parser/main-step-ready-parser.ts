import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckEvents } from './deck-events';
import { EventParser } from './event-parser';

export class MainStepReadyParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MAIN_STEP_READY;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// We use this to distinguish between mulligan over but getting cards from mulligan and
		// real draw start
		if (currentState.currentTurn !== 0) {
			return currentState;
		}
		return Object.assign(new GameState(), currentState, {
			mulliganOver: true,
			currentTurn: 1,
		} as GameState);
	}

	event(): string {
		return DeckEvents.MULLIGAN_OVER;
	}
}
