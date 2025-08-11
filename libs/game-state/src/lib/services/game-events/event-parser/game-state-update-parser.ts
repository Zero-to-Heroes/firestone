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
			playerDeck: currentState.playerDeck.update({
				fullGameState: gameEvent.gameState?.Player,
			}),
			opponentDeck: currentState.opponentDeck.update({
				fullGameState: gameEvent.gameState?.Opponent,
			}),
		});
	}

	event(): string {
		return GameEvent.GAME_STATE_UPDATE;
	}
}
