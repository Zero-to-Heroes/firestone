import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class GameStateUpdateParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.debug('[debug] [game-state-update] updating game state', gameEvent);
		return currentState.update({
			fullGameState: gameEvent.gameState,
		});
	}

	event(): string {
		return GameEvent.GAME_STATE_UPDATE;
	}
}
