import { MatchStats } from '../../../../../models/mainwindow/stats/match-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MatchStatsAvailableEvent implements MainWindowStoreEvent {
	constructor(readonly stats: MatchStats) {}

	public static eventName(): string {
		return 'MatchStatsAvailableEvent';
	}

	public eventName(): string {
		return 'MatchStatsAvailableEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return true;
	}
}
