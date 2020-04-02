import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsResetBattleStateEvent } from '../events/bgs-reset-battle-state-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsResetBattleStateParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsResetBattleStateEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsResetBattleStateEvent): Promise<BattlegroundsState> {
		return currentState.update({
			currentGame: currentState.currentGame.resetBattleBoardInfo(),
		} as BattlegroundsState);
	}
}
