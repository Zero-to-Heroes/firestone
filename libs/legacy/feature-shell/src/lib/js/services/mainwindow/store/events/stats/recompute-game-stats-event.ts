import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
