import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class RecomputeGameStatsEvent implements MainWindowStoreEvent {
	constructor(readonly gameStats: GameStats) {}

	public static eventName(): string {
		return 'RecomputeGameStatsEvent';
	}

	public eventName(): string {
		return 'RecomputeGameStatsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return true;
	}
}
