import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class MulliganOverParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			mulliganOver: true,
			currentTurn: 0,
		});
	}

	event(): string {
		return GameEvent.MULLIGAN_INPUT;
	}
}
