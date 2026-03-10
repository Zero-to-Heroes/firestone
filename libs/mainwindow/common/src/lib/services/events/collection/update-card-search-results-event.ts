import { MainWindowStoreEvent } from '../main-window-store-event';

export class UpdateCardSearchResultsEvent implements MainWindowStoreEvent {
	readonly eventName = UpdateCardSearchResultsEvent.eventName
	readonly searchString: string;

	constructor(searchString: string) {
		this.searchString = searchString;
	}

	static readonly eventName = 'UpdateCardSearchResultsEvent'
}
