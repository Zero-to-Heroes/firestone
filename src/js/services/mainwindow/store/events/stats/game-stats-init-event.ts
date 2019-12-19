import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class GameStatsInitEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GameStatsInitEvent';
	}

	constructor(public readonly newState: StatsState) {}

	public eventName(): string {
		return 'GameStatsInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
