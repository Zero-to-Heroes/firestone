import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeDeckModeFilterEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ChangeDeckModeFilterEvent';
	}

	public eventName(): string {
		return 'ChangeDeckModeFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
