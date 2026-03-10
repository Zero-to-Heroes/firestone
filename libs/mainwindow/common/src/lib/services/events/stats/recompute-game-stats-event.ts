import { MainWindowStoreEvent } from '../main-window-store-event';
import { GameStat } from '@firestone/stats/data-access';

export class RecomputeGameStatsEvent implements MainWindowStoreEvent {
	
	readonly eventName = RecomputeGameStatsEvent.eventName

	constructor(public readonly gameStat: GameStat) {}

	static readonly eventName = 'RecomputeGameStatsEvent'
}
