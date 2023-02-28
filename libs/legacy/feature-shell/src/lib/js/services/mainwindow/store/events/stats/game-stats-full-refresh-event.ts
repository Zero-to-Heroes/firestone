import { MainWindowStoreEvent } from '../main-window-store-event';

export class GamesFullRefreshEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GamesFullRefreshEvent';
	}

	public eventName(): string {
		return 'GamesFullRefreshEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
