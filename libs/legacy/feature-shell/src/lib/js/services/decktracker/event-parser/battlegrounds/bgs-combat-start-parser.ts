import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameEvent, GameState } from '@firestone/game-state';
import { EventParser } from '../_event-parser';

export class BgsCombatStartParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const newGame = currentState.bgState.currentGame.update({
			phase: 'combat',
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
				// TODO: if we do this too early, we will remove info that is needed for the sim
				// duoPendingBoards: [],
				// playerTeams: null,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_COMBAT_START;
	}
}
