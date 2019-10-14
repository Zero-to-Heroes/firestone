import { MainWindowStoreEvent } from '../main-window-store-event';

export class CloseMatchStatsWindowEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CloseMatchStatsWindowEvent';
	}

	public eventName(): string {
		return 'CloseMatchStatsWindowEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
