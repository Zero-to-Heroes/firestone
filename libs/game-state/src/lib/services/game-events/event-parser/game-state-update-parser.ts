import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class GameStateUpdateParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			fullGameState: gameEvent.gameState,
		});
	}

	event(): string {
		return GameEvent.GAME_STATE_UPDATE;
	}
}
