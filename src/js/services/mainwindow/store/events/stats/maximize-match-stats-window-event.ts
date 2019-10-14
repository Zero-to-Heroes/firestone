import { MainWindowStoreEvent } from '../main-window-store-event';

export class MaximizeMatchStatsWindowEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MaximizeMatchStatsWindowEvent';
	}

	public eventName(): string {
		return 'MaximizeMatchStatsWindowEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
