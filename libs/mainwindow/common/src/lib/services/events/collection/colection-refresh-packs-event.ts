import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionRefreshPacksEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CollectionRefreshPacksEvent';
	}

	public eventName(): string {
		return 'CollectionRefreshPacksEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
