import { MainWindowStoreEvent } from '../main-window-store-event';
import { GameStat } from '@firestone/stats/data-access';

export class RecomputeGameStatsEvent implements MainWindowStoreEvent {
	constructor(public readonly gameStat: GameStat) {}

	public static eventName(): string {
		return 'RecomputeGameStatsEvent';
	}

	public eventName(): string {
		return 'RecomputeGameStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
