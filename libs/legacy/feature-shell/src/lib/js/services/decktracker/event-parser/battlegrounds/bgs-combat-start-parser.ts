import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsCombatStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const newGame = currentState.bgState.currentGame.update({
			phase: 'combat',
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
				duoPendingBoards: [],
				playerTeams: null,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_COMBAT_START;
	}
}
