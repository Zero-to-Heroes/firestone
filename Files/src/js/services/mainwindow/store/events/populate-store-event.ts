import { MainWindowStoreEvent } from './main-window-store-event';

export class PopulateStoreEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'PopulateStoreEvent';
	}

	public eventName(): string {
		return 'PopulateStoreEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
