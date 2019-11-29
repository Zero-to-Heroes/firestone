import { MainWindowStoreEvent } from '../main-window-store-event';

export class MinimizeMatchStatsWindowEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MinimizeMatchStatsWindowEvent';
	}

	public eventName(): string {
		return 'MinimizeMatchStatsWindowEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
