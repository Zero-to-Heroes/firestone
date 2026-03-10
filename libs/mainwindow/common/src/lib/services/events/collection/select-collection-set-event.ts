import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectCollectionSetEvent implements MainWindowStoreEvent {
	
	readonly eventName = SelectCollectionSetEvent.eventName

	constructor(setId: string) {
		this.setId = setId;
	}
	readonly setId: string;

	static readonly eventName = 'SelectCollectionSetEvent'
}
