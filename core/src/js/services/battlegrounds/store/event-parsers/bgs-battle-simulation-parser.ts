import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleSimulationParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BattlegroundsBattleSimulationEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsBattleSimulationEvent,
	): Promise<BattlegroundsState> {
		console.debug('[bgs-simulation-parser] setting battle result', event.result.damageWon);
		return currentState.update({
			currentGame: currentState.currentGame.update({
				battleResult: event.result,
				battleInfoStatus: 'done',
			} as BgsGame),
		} as BattlegroundsState);
	}
}
