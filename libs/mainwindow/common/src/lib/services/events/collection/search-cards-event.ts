import { MainWindowStoreEvent } from '../main-window-store-event';

export class SearchCardsEvent implements MainWindowStoreEvent {
	
	readonly eventName = SearchCardsEvent.eventName

	constructor(searchString: string) {
		this.searchString = searchString;
	}
	readonly searchString: string;

	static readonly eventName = 'SearchCardsEvent'
}
