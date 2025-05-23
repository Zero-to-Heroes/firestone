import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

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
