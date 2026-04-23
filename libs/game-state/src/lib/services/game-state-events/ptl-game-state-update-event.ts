import { PtlGameStateUpdate } from '@firestone/power-log-parser';
import { GameStateEvent } from './game-state-event';

export class PtlGameStateUpdateEvent implements GameStateEvent {
	static readonly TYPE = 'PTL_GAME_STATE_UPDATE';
	readonly type = PtlGameStateUpdateEvent.TYPE;

	constructor(public readonly update: PtlGameStateUpdate) {}
}
