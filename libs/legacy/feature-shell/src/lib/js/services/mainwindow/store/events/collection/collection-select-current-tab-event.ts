import { CurrentView } from '../../../../../models/mainwindow/collection/current-view.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionSelectCurrentTabEvent implements MainWindowStoreEvent {
	constructor(public readonly tab: CurrentView) {}

	public static eventName(): string {
		return 'CollectionSelectCurrentTabEvent';
	}

	public eventName(): string {
		return 'CollectionSelectCurrentTabEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
