import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameEvent, GameState } from '@firestone/game-state';
import { EventParser } from '../_event-parser';

export class BgsActivePlayerBoardProcessParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const playerTeams = gameEvent.additionalData.playerTeams;
		return currentState.update({
			bgState: currentState.bgState.update({
				playerTeams: playerTeams,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_ACTIVE_PLAYER_BOARD_PROCESS;
	}
}
