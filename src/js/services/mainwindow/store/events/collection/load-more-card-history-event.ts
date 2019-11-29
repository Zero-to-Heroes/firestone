import { MainWindowStoreEvent } from '../main-window-store-event';

export class LoadMoreCardHistoryEvent implements MainWindowStoreEvent {
	constructor(maxResults: number) {
		this.maxResults = maxResults;
	}
	readonly maxResults: number;

	public static eventName(): string {
		return 'LoadMoreCardHistoryEvent';
	}

	public eventName(): string {
		return 'LoadMoreCardHistoryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
