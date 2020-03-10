import { BattlegroundsState } from '../../../models/battlegrounds/old/battlegrounds-state';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
import { BattlegroundsEvent } from '../events/battlegrounds-event';
import { EventParser } from './event-parser';

export class BattlegroundsBattleSimulationParser implements EventParser {
	public applies(gameEvent: BattlegroundsEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BattlegroundsBattleSimulationEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsBattleSimulationEvent,
	): Promise<BattlegroundsState> {
		return currentState.update({ battleResult: event.result } as BattlegroundsState);
	}

	public event() {
		return 'BATTLEGROUNDS_BATTLE_SIMULATION_RESULT';
	}
}
