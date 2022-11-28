import { MainWindowStoreEvent } from '../main-window-store-event';

export class UpdateCardSearchResultsEvent implements MainWindowStoreEvent {
	constructor(searchString: string) {
		this.searchString = searchString;
	}
	readonly searchString: string;

	public static eventName(): string {
		return 'UpdateCardSearchResultsEvent';
	}

	public eventName(): string {
		return 'UpdateCardSearchResultsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
