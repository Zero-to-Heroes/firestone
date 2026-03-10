import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionRefreshPacksEvent implements MainWindowStoreEvent {
	readonly eventName = CollectionRefreshPacksEvent.eventName

	static readonly eventName = 'CollectionRefreshPacksEvent'
}
