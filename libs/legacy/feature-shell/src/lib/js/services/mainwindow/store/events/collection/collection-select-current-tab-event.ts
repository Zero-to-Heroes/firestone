import { CurrentView } from '@firestone/collection/common';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
