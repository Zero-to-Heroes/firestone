import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class MulliganOverParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return Object.assign(new GameState(), currentState, {
			mulliganOver: true,
			currentTurn: 0,
		} as GameState);
	}

	event(): string {
		return GameEvent.MULLIGAN_INPUT;
	}
}
