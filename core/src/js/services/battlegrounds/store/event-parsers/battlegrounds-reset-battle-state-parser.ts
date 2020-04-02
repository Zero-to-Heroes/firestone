import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from './_event-parser';

export class BattlegroundsResetBattleStateParser implements EventParser {
	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === GameEvent.MAIN_STEP_READY;
	}

	public async parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState> {
		// return currentState.resetBattleBoardInfo();
		return currentState;
	}

	public event() {
		return GameEvent.MAIN_STEP_READY;
	}
}
