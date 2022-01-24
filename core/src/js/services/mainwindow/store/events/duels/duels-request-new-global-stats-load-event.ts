import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsRequestNewGlobalStatsLoadEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsRequestNewGlobalStatsLoadEvent';
	}

	public eventName(): string {
		return 'DuelsRequestNewGlobalStatsLoadEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
