import { MatchStatsCurrentStat } from '../../../../../models/mainwindow/stats/current-stat.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeMatchStatCurrentStatEvent implements MainWindowStoreEvent {
	constructor(readonly newStat: MatchStatsCurrentStat) {}

	public static eventName(): string {
		return 'ChangeMatchStatCurrentStatEvent';
	}

	public eventName(): string {
		return 'ChangeMatchStatCurrentStatEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
