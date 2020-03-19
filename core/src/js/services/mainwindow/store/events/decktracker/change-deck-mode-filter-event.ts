import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeDeckModeFilterEvent implements MainWindowStoreEvent {
	constructor() {}

	public static eventName(): string {
		return 'ChangeDeckModeFilterEvent';
	}

	public eventName(): string {
		return 'ChangeDeckModeFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
