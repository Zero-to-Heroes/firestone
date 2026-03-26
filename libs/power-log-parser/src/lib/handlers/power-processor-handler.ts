import { GameEventProvider } from '../game-event';
import { Node } from '../models';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class PowerProcessorHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		stateFacade: StateFacade,
	): void {
		if (stateType === StateType.PowerTaskList && state.ReconnectionOngoing) {
			state.ReconnectionOngoing = false;
			stateFacade.GsState!.ReconnectionOngoing = false;
			state.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'RECONNECT_OVER',
					() => ({
						Type: 'RECONNECT_OVER',
					}),
					false,
					new Node(null as any, null, 0, null, data),
				),
			]);
		}
	}
}
