import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
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
